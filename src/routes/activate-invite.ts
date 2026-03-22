import type { GenericEndpointContext } from "better-auth";
import { createAuthEndpoint, originCheck } from "better-auth/api";
import type { UserWithRole } from "better-auth/plugins";
import * as z from "zod";
import { getInviteAdapter } from "../adapter";
import { INVITE_COOKIE_NAME } from "../constants";
import type { NewInviteOptions } from "../types";
import { consumeInvite, optionalSessionMiddleware } from "../utils";

export const activateInvite = (options: NewInviteOptions) => {
	return createAuthEndpoint(
		"/invite/activate",
		{
			method: "POST",
			use: [
				optionalSessionMiddleware,
				originCheck((ctx) => ctx.body.callbackURL),
			],
			body: z.object({
				/**
				 * Where to redirect the user after sing in/up
				 */
				callbackURL: z
					.string()
					.describe("Where to redirect the user after sing in/up")
					.optional(),
				/**
				 * The invite token.
				 */
				token: z.string().describe("The invite token"),
			}),
			metadata: {
				openapi: {
					operationId: "activateInvite",
					description:
						"Redirects the user to the callback URL with the token in a cookie",
					responses: {
						"200": {
							description: "Invite activated successfully",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											status: { type: "boolean", example: true },
											message: {
												type: "string",
												example: "Invite activated successfully",
											},
											action: {
												type: "string",
												example: "SIGN_IN_UP_REQUIRED",
											},
											redirectTo: {
												type: "string",
												example: "/auth/sign-in",
											},
										},
										required: ["status", "message"],
									},
								},
							},
						},
						"400": {
							description: "Invalid or expired invite token",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											errorCode: { type: "string", example: "INVALID_TOKEN" },
											message: { type: "string" },
										},
									},
								},
							},
						},
						"500": {
							description: "Internal server error",
						},
					},
				},
			},
		},
		(ctx) => {
			return activateInviteLogic(options, ctx, ctx.body);
		},
	);
};

export const activateInviteLogic = async (
	options: NewInviteOptions,
	ctx: GenericEndpointContext,
	body: { token: string; callbackURL?: string },
) => {
	const adapter = getInviteAdapter(ctx.context, options);

	const invitation = await adapter.findInvitation(body.token);

	if (!invitation) {
		throw ctx.error("BAD_REQUEST", {
			message: "Invalid invite token",
			code: "INVALID_TOKEN",
		});
	}

	const timesUsed = await adapter.countInvitationUses(invitation.id);

	if (!(timesUsed < invitation.maxUses)) {
		throw ctx.error("BAD_REQUEST", {
			message: "Invite token has already been used",
			code: "INVALID_TOKEN",
		});
	}

	if (options.getDate() > invitation.expiresAt) {
		throw ctx.error("BAD_REQUEST", {
			message: "Invite token has expired",
			code: "INVALID_TOKEN",
		});
	}

	const sessionObject = ctx.context.session;
	const session = sessionObject?.session;
	let invitedUser = sessionObject?.user as UserWithRole | null;

	if (invitedUser && session) {
		const before = await options.inviteHooks?.beforeAcceptInvite?.({
			ctx,
			invitedUser,
		});
		if (before?.user) {
			invitedUser = before.user;
		}

		await consumeInvite({
			ctx,
			invitation,
			invitedUser,
			options,
			userId: invitedUser.id,
			timesUsed,
			token: body.token,
			session,
			newAccount: false,
			adapter,
		});

		await options.inviteHooks?.afterAcceptInvite?.({
			ctx,
			invitation,
			invitedUser,
		});

		return ctx.json({
			status: true,
			message: "Invite activated successfully",
			action: "REDIRECT_TO_AFTER_UPGRADE",
			redirectTo: invitation.redirectToAfterUpgrade?.replace(
				"{token}",
				invitation.token,
			),
		});
	}

	// If user doesn't already exist, we set a cookie and redirect them to the sign in/up page

	// Get cookie name (customizable)
	const maxAge = options.inviteCookieMaxAge ?? 10 * 60; // 10 minutes
	const inviteCookie = ctx.context.createAuthCookie(INVITE_COOKIE_NAME, {
		maxAge,
	});

	await ctx.setSignedCookie(
		inviteCookie.name,
		body.token,
		ctx.context.secret,
		inviteCookie.attributes,
	);

	return ctx.json({
		status: true,
		message: "Please sign in or sign up to continue.",
		action: "SIGN_IN_UP_REQUIRED",
		redirectTo: body.callbackURL ?? options.defaultRedirectToSignIn,
	});
};
