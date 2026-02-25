import { createAuthEndpoint, originCheck } from "better-auth/api";
import * as z from "zod";
import type { afterUpgradeTypes, NewInviteOptions } from "../types";
import {
	createRedirectAfterUpgradeURL,
	optionalSessionMiddleware,
} from "../utils";
import { activateInviteLogic } from "./activate-invite-logic";

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
		async (ctx) => {
			const { token, callbackURL } = ctx.body;

			const error = (
				httpErrorCode: Parameters<typeof ctx.error>[0],
				errorMessage: string,
				urlErrorCode: string,
			) =>
				ctx.error(httpErrorCode, {
					message: errorMessage,
					errorCode: urlErrorCode,
				});

			const afterUpgrade = (opts: afterUpgradeTypes) =>
				ctx.json({
					status: true,
					message: "Invite activated successfully",
					redirectTo: createRedirectAfterUpgradeURL(opts.invitation),
				});

			const needToSignInUp = () =>
				ctx.json({
					status: true,
					message: "Invite activated successfully",
					action: "SIGN_IN_UP_REQUIRED",
					redirectTo: callbackURL ?? options.defaultRedirectToSignIn,
				});

			return await activateInviteLogic({
				ctx,
				options,
				token,
				error,
				afterUpgrade,
				needToSignInUp,
			});
		},
	);
};
