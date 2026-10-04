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
		// activate invite callback (which is NOT recommended). New apps should use
		// `acceptInviteCallback` instead. `/invite/:token` is now handled by the new
		// accept invite callback flow.
		"/invite/:token/activate",
		{
			method: "GET",
			use: [originCheck((ctx) => ctx.query.callbackURL)],
			query: z.object({
				/**
				 * Where to redirect the user after sign in/up
				 * {token} will be replaced by the actual token from the URL path.
				 *
				 * Note: This is called `callbackURL` instead of `callbackUrl` to match the query parameter name used in the old activate invite callback flow.
				 *
				 * @default /
				 */
				callbackURL: z
					.string()
					.describe("Where to redirect the user after sign in/up")
					.optional(),
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
							description: "Where to redirect the user after sign in/up",
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
					"activateInviteCallback is deprecated. Use acceptInviteCallback instead.",
					'This callback should only be triggered from invitation URLs. If you are calling GET client.invite[":token"] directly in your app, migrate to acceptInvite (POST /invite/accept) instead.',
				);
				alreadyWarned = true;
			}

			let res: Awaited<ReturnType<typeof acceptInviteLogic>> | null = null;
			try {
				res = await acceptInviteLogic(options, ctx, {
					...ctx.params,
					...ctx.query,
					callbackUrl: ctx.query.callbackURL,
				});
			} catch (e) {
				const err = e as
					| { body?: { code?: string; message?: string } }
					| undefined;

				const error = err?.body?.code ?? "SERVER_ERROR";
				const message = err?.body?.message ?? "Internal server error";

				return ctx.redirect(
					redirectError(ctx.context, ctx.query.callbackURL, { message, error }),
				);
			}

			if (!res) {
				return;
			}

			if (res.action === "REDIRECT_TO_AFTER_UPGRADE" && res.redirectTo) {
				return ctx.redirect(redirectError(ctx.context, res.redirectTo));
			}

			if (res.action === "SIGN_IN_UP_REQUIRED")
				return ctx.redirect(
					redirectCallback(
						ctx.context,
						res.redirectTo ?? options.defaultRedirectToSignIn,
					),
				);

			return ctx.redirect(
				redirectError(ctx.context, ctx.query.callbackURL, {
					message: "Internal server error",
					error: "SERVER_ERROR",
				}),
			);
		},
	);
};
