import { createAuthEndpoint, originCheck } from "better-auth/api";
import * as z from "zod";
import type { NewInviteOptions } from "../types";
import { redirectCallback, redirectError } from "../utils";
import { acceptInviteLogic } from "./accept-invite";

let alreadyWarned = false;

/**
 * This endpoint is what runs when a user clicks an invite link (from email, for example).
 *
 * It doesn't implement the invite logic itself. Instead, it acts as a bridge:
 *
 * - It takes a browser request (GET + query params)
 * - Calls the core logic (acceptInviteLogic)
 * - Converts the result into a redirect
 *
 * Think of it as a "bridge" between JSON responses and browser redirects.
 *
 * @deprecated Use `acceptInviteCallback` instead. This endpoint will remain available for backward compatibility, but it may be removed in a future release.
 */
export const activateInviteCallback = (options: NewInviteOptions) => {
	return createAuthEndpoint(
		// This route exists for backwards compatibility with apps still using the old
		// activate invite callback (which is NOT recommended). New apps should use `acceptInvite` instead.
		// `/invite/:token` is now handled by the new accept invite flow.
		// This works because when using activateInviteCallback, this route is called,
		// but when using /invite/:token, the new accept invite callback flow is called.
		"/invite/:token/activate",
		{
			method: "GET",
			use: [
				originCheck((ctx) => ctx.query.callbackURL),
				originCheck((ctx) => ctx.query.signInUpUrl),
			],
			query: z.object({
				/**
				 * Where to redirect the user after sing in/up
				 * {token} will be replaced by the actual token in the request body.
				 *
				 * Note: This is called `callbackURL` instead of `callbackUrl` to match the query parameter name used in the old activate invite callback flow.
				 *
				 * @default /
				 */
				callbackURL: z
					.string()
					.describe("Where to redirect the user after sing in/up")
					.optional(),
				/**
				 * Where to redirect the user to sign in/up.
				 * {callbackUrl} will be replaced by the actual callbackUrl in the request body.
				 */
				signInUpUrl: z
					.string()
					.describe("The URL of the sign in/up page.")
					.optional(),
				/**
				 * The email address of the user to sign in/up to.
				 */
				email: z
					.email()
					.optional()
					.describe("The email address of the user to sign in/up to"),
			}),
			metadata: {
				openapi: {
					operationId: "activateInviteCallback",
					description:
						"Redirects the user to the callback URL with the token in a cookie. If an error occurs, the user is redirected to the callback URL with the query parameters 'error' and 'message'.",
					parameters: [
						{
							name: "token",
							in: "path",
							required: true,
							description: "The invitation token",
							schema: {
								type: "string",
							},
						},
						{
							name: "callbackURL",
							in: "query",
							required: true,
							description: "Where to redirect the user after sing in/up",
							schema: {
								type: "string",
							},
						},
					],
					responses: {
						"302": {
							description:
								"Redirects the user to the callback URL. On error, includes 'error' and 'message' query parameters.",
							headers: {
								Location: {
									description: "Redirect destination",
									schema: {
										type: "string",
									},
								},
							},
						},
					},
				},
			},
		},
		async (ctx) => {
			if (!alreadyWarned) {
				ctx.context.logger.warn(
					"activateInvite callback is deprecated. Use acceptInvite instead.",
					'This callback should only be triggered from invitation URLs. If you are calling client.invite.[":token"]() directly in your app, migrate to acceptInvite instead.',
				);
				alreadyWarned = true;
			}

			let res: Awaited<ReturnType<typeof acceptInviteLogic>> | null = null;
			try {
				// Run the real invite logic
				res = await acceptInviteLogic(options, ctx, {
					...ctx.params,
					...ctx.query,
					callbackUrl: ctx.query.callbackURL,
				});
			} catch (e) {
				// If something fails, we don't return JSON, we redirect with error info
				const err = e as
					| { body?: { code?: string; message?: string } }
					| undefined;

				const error = err?.body?.code ?? "SERVER_ERROR";
				const message = err?.body?.message ?? "Internal server error";

				return ctx.redirect(
					redirectError(ctx.context, ctx.query.callbackURL, { message, error }),
				);
			}

			// Shouldn't really happen, but just in case
			if (!res) {
				return;
			}

			// User is already logged in => upgrade flow
			if (res.action === "REDIRECT_TO_AFTER_UPGRADE" && res.redirectTo) {
				return ctx.redirect(redirectError(ctx.context, res.redirectTo));
			}

			// User needs to sign in or sign up first
			if (res.action === "SIGN_IN_UP_REQUIRED")
				return ctx.redirect(
					redirectCallback(
						ctx.context,
						res.redirectTo ?? options.defaultRedirectToSignIn,
					),
				);

			// Fallback: something unexpected happened
			return ctx.redirect(
				redirectError(ctx.context, ctx.query.callbackURL, {
					message: "Internal server error",
					error: "SERVER_ERROR",
				}),
			);
		},
	);
};
