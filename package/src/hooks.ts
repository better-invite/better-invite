import type { HookEndpointContext } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { expireCookie } from "better-auth/cookies";
import type { UserWithRole } from "better-auth/plugins";
import * as z from "zod";
import { getInviteAdapter } from "./adapter";
import { ERROR_CODES, INVITE_COOKIE_NAME } from "./constants";
import type { NewInviteOptions } from "./types";
import { consumeInvite, redirectError } from "./utils";

export const invitesHooks = (options: NewInviteOptions) => {
	return {
		after: [
			{
				// Run this after sign in/up and callback endpoints to check for invite tokens
				matcher: (context: HookEndpointContext) =>
					context.path === "/sign-up/email" ||
					context.path === "/sign-in/email" ||
					context.path === "/sign-in/email-otp" ||
					context.path === "/callback/:id" ||
					context.path === "/verify-email",

				handler: createAuthMiddleware(async (ctx) => {
					// Make sure we have a new session with a user
					const validation = z
						.object({
							user: z.object({ id: z.string() }),
						})
						.safeParse(ctx.context.newSession);

					if (!validation.success) return;

					const userId = validation.data.user.id;

					// Load the full user
					let invitedUser = (await ctx.context.internalAdapter.findUserById(
						userId,
					)) as UserWithRole | null;

					if (!invitedUser) return;

					// Read the invite token from the cookie
					const maxAge = options.inviteCookieMaxAge ?? 10 * 60;
					const inviteCookie = ctx.context.createAuthCookie(
						INVITE_COOKIE_NAME,
						{ maxAge },
					);

					const inviteToken = await ctx.getSignedCookie(
						inviteCookie.name,
						ctx.context.secret,
					);

					if (!inviteToken) return;

					const adapter = getInviteAdapter(ctx.context, options);

					const invitation = await adapter.findInvitation(inviteToken);
					if (!invitation) return;

					// Validate invite expiration
					if (invitation.expiresAt < options.getDate()) {
						throw APIError.from(
							"BAD_REQUEST",
							ERROR_CODES.INVALID_OR_EXPIRED_INVITE,
						);
					}

					const timesUsed = await adapter.countInvitationUses(invitation.id);

					// Check if the invite was already fully used
					if (!invitation.infinityMaxUses && timesUsed >= invitation.maxUses) {
						throw APIError.from(
							"BAD_REQUEST",
							ERROR_CODES.NO_USES_LEFT_FOR_INVITE,
						);
					}

					// Get active session
					const session =
						ctx.context.newSession?.session ?? ctx.context.session?.session;

					if (!session) {
						throw APIError.from("INTERNAL_SERVER_ERROR", {
							message: "No session found for updating cookie",
							code: "INTERNAL_SERVER_ERROR",
						});
					}

					// Optional hook before accepting the invite
					const before = await options.inviteHooks?.beforeAcceptInvite?.({
						ctx,
						invitedUser,
					});

					if (before?.user) invitedUser = before.user;

					// Consume the invite (update role, refresh session, etc)
					await consumeInvite({
						ctx,
						invitation,
						invitedUser,
						session,
						options,
						adapter,
						meta: {
							userId,
							timesUsed,
							token: inviteToken,
							newAccount: true,
						},
					});

					// Clean up cookie after successful use
					expireCookie(ctx, inviteCookie);

					// Optional hook after accepting
					await options.inviteHooks?.afterAcceptInvite?.({
						ctx,
						invitation,
						invitedUser,
					});

					// Redirect user after upgrading their role
					const redirectURL = invitation.redirectToAfterUpgrade?.replace(
						"{token}",
						ctx.params.token,
					);

					return ctx.redirect(redirectError(ctx.context, redirectURL));
				}),
			},
		],
	};
};
