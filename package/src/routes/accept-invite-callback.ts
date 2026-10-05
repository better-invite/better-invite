import { createAuthEndpoint, originCheck } from "better-auth/api";
import * as z from "zod";
import type { NewInviteOptions } from "../types";
import { redirectCallback, redirectError, replacePlaceholders } from "../utils";
import { acceptInviteLogic } from "./accept-invite";

export const acceptInviteCallback = (options: NewInviteOptions) => {
	return createAuthEndpoint(
		"/invite/:token",
		{
			method: "GET",
			use: [
				originCheck((ctx) => ctx.query.callbackUrl),
				originCheck((ctx) => ctx.query.callbackURL),
				originCheck((ctx) => ctx.query.signInUpUrl),
			],
			query: z.object({
				/**
				 * Where to redirect the user after sign in/up.
				 * `{token}` will be replaced by the actual token from the URL path.
				 *
				 * @default /
				 */
				callbackUrl: z
					.string()
					.describe("Where to redirect the user after sign in/up")
					.optional(),
				/**
				 * @deprecated Use `callbackUrl`
				 *
				 * Where to redirect the user after accepting the invite.
				 * {token} will be replaced by the actual token in the request body.
				 *
				 * @default /
				 */
				callbackURL: z
					.string()
					.describe(
						"Where to redirect the user after accepting the invite. {token} will be replaced by the actual token in the request body.",
					)
					.optional(),
				/**
				 * Where to redirect the user to sign in/up.
				 * {callbackUrl} will be replaced by the actual callback URL from the query string.
				 * {email} will be replaced by the actual email in private invites.
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
					operationId: "acceptInviteCallback",
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
							name: "callbackUrl",
							in: "query",
							required: false,
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
			const { callbackUrl, callbackURL } = ctx.query;
			const errorCallbackUrl = callbackUrl ?? callbackURL;
			const expandedErrorCallbackUrl = errorCallbackUrl
				? replacePlaceholders(errorCallbackUrl, { token: ctx.params.token })
				: undefined;

			let res: Awaited<ReturnType<typeof acceptInviteLogic>> | null = null;
			try {
				res = await acceptInviteLogic(options, ctx, {
					...ctx.params,
					...ctx.query,
					callbackUrl: callbackUrl ?? callbackURL,
				});
			} catch (e) {
				const err = e as
					| { body?: { code?: string; message?: string } }
					| undefined;

				const error = err?.body?.code ?? "SERVER_ERROR";
				const message = err?.body?.message ?? "Internal server error";

				return ctx.redirect(
					redirectError(ctx.context, expandedErrorCallbackUrl, {
						message,
						error,
					}),
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
				redirectError(ctx.context, expandedErrorCallbackUrl, {
					message: "Internal server error",
					error: "SERVER_ERROR",
				}),
			);
		},
	);
};
