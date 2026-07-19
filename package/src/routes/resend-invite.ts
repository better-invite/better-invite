import { APIError, createAuthEndpoint } from "better-auth/api";
import * as z from "zod";
import { getInviteAdapter } from "../adapter";
import { defaultRedirectAfterUpgrade, ERROR_CODES } from "../constants";
import type { NewInviteOptions } from "../types";
import { createRedirectURL, normalizeArray } from "../utils";

export const resendInvite = (options: NewInviteOptions) => {
	return createAuthEndpoint(
		"/invite/resend",
		{
			method: "POST",
			body: z.object({
				/**
				 * The invite token to resend.
				 */
				token: z.string().describe("The invite token to resend."),

				/**
				 * Where to redirect users who need to sign up.
				 * Uses plugin default if not provided.
				 */
				redirectToSignUp: z.string().optional(),

				/**
				 * Where to redirect users who need to sign in.
				 * Uses plugin default if not provided.
				 */
				redirectToSignIn: z.string().optional(),

				/**
				 * Custom URL used for the invite.
				 * Uses plugin default if not provided.
				 */
				customInviteUrl: z.string().optional(),

				/**
				 * Where to redirect the user after accepting the invite.
				 * Uses the stored invite value or plugin default if not provided.
				 */
				redirectToAfterUpgrade: z.string().optional(),
			}),
			metadata: {
				openapi: {
					operationId: "resendInvite",
					description: "Resend invitation emails for a private invitation.",
				},
			},
		},
		async (ctx) => {
			const adapter = getInviteAdapter(ctx.context, options);

			const invitation = await adapter.findInvitation(ctx.body.token);

			if (!invitation) {
				throw APIError.from("BAD_REQUEST", ERROR_CODES.INVALID_TOKEN);
			}

			const emails = normalizeArray(invitation.emails ?? invitation.email);

			// Resending only works for private invites.
			if (emails.length === 0) {
				throw APIError.from("BAD_REQUEST", ERROR_CODES.INVALID_TOKEN);
			}

			if (!options.sendUserInvitation) {
				ctx.context.logger.warn(
					"Invitation email is not enabled. Pass `sendUserInvitation` to the plugin options to enable it.",
				);

				throw APIError.from(
					"INTERNAL_SERVER_ERROR",
					ERROR_CODES.INVITATION_EMAIL_NOT_ENABLED,
				);
			}

			const redirectToSignUp =
				ctx.body.redirectToSignUp ?? options.defaultRedirectToSignUp;

			const redirectToSignIn =
				ctx.body.redirectToSignIn ?? options.defaultRedirectToSignIn;

			const customInviteUrl =
				ctx.body.customInviteUrl ?? options.defaultCustomInviteUrl;

			const redirectToAfterUpgrade =
				ctx.body.redirectToAfterUpgrade ??
				invitation.callbackUrl ??
				options.defaultRedirectAfterUpgrade ??
				defaultRedirectAfterUpgrade;

			await options.inviteHooks?.beforeCreateInvite?.({
				ctx,
			});

			const recipients = await Promise.all(
				emails.map(async (email) => {
					const invitedUser = await ctx.context.internalAdapter.findUserByEmail(
						email,
						{
							includeAccounts: true,
						},
					);

					return {
						email,
						invitedUser,
						signInUpUrl: invitedUser ? redirectToSignIn : redirectToSignUp,
						newAccount: !invitedUser,
					};
				}),
			);

			for (const recipient of recipients) {
				const redirectURL = createRedirectURL({
					ctx,
					invitation,
					signInUpUrl: recipient.signInUpUrl,
					customInviteUrl,
					email: recipient.email,
					callbackUrl: redirectToAfterUpgrade,
				});

				try {
					await options.sendUserInvitation(
						{
							email: recipient.email,
							name: recipient.invitedUser?.user.name,
							role: invitation.role,
							url: redirectURL.toString(),
							token: invitation.token,
							newAccount: recipient.newAccount,
						},
						ctx.request,
					);
				} catch (error) {
					ctx.context.logger.error(
						"Error sending the invitation email: ",
						error,
					);

					throw APIError.from(
						"INTERNAL_SERVER_ERROR",
						ERROR_CODES.ERROR_SENDING_THE_INVITATION_EMAIL,
					);
				}
			}

			return ctx.json({
				status: true,
				message:
					emails.length === 1
						? "The invitation was resent"
						: "The invitations were resent",
			});
		},
	);
};
