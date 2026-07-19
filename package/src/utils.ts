import {
	APIError,
	type AuthContext,
	type BetterAuthPlugin,
	type GenericEndpointContext,
	generateId,
	type Session,
} from "better-auth";
import { getSessionFromCtx } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import { generateRandomString } from "better-auth/crypto";
import type { admin, UserWithRole } from "better-auth/plugins";
import type { InviteAdapter } from "./adapter";
import { defaultRedirectAfterUpgrade, ERROR_CODES } from "./constants";
import type { CreateInvite } from "./routes/create-invite";
import type {
	InviteOptions,
	InviteTypeWithId,
	NewInviteOptions,
	Permissions,
	TokensType,
} from "./types";

type ConsumeInviteParams = {
	ctx: GenericEndpointContext;
	invitation: InviteTypeWithId;
	invitedUser: UserWithRole;
	session: Session;
	options: NewInviteOptions;
	adapter: InviteAdapter;
	meta: {
		userId: string;
		token: string;
		timesUsed: number;
		newAccount: boolean;
	};
};

/**
 * Handles the full invite acceptance flow.
 *
 * Validates the invite, updates the user's role,
 * refreshes the session, and manages invite usage.
 * Also runs optional hooks if provided.
 *
 * Throws if the invite is invalid, expired,
 * doesn't match the user, or can't be accepted.
 */
export const consumeInvite = async ({
	ctx,
	invitation,
	invitedUser,
	session,
	options,
	adapter,
	meta,
}: ConsumeInviteParams) => {
	const { userId, token, timesUsed, newAccount } = meta;

	// Normalize emails and detect private invite
	const emails = normalizeArray(invitation.emails ?? invitation.email);
	const isPrivate = emails.length > 0;

	// Validate email for private invites
	if (isPrivate && !emails.includes(invitedUser.email)) {
		throw APIError.from("BAD_REQUEST", ERROR_CODES.INVALID_EMAIL);
	}

	// Validate invitation status
	if (invitation.status && invitation.status !== "pending") {
		throw APIError.from("BAD_REQUEST", ERROR_CODES.INVALID_TOKEN);
	}

	// Check permissions
	const canAcceptRaw =
		typeof options.canAcceptInvite === "function"
			? await options.canAcceptInvite({ invitedUser, newAccount })
			: options.canAcceptInvite;

	const canAccept =
		typeof canAcceptRaw === "object"
			? await checkPermissions(ctx, canAcceptRaw)
			: canAcceptRaw;

	console.log(canAccept);
	if (!canAccept) {
		throw APIError.from("BAD_REQUEST", ERROR_CODES.CANT_ACCEPT_INVITE);
	}

	// Update user role
	await ctx.context.adapter.update({
		model: "user",
		where: [{ field: "id", value: userId }],
		update: { role: invitation.role },
	});

	const updatedUser = { ...invitedUser, role: invitation.role };

	// Update session with new role
	await setSessionCookie(ctx, {
		session,
		user: updatedUser,
	});

	const maxUses = getMaxUses(invitation);
	const usedAt = options.getDate();
	const isLastUse = timesUsed === maxUses - 1;
	const shouldCleanup = isLastUse && options.cleanupInvitesAfterMaxUses;
	const shouldCreateInviteUse = !shouldCleanup;

	// Handle invite lifecycle
	if (shouldCleanup) {
		await adapter.deleteInviteUses(invitation.id);
		await adapter.deleteInvitation(token);
	}

	if (isLastUse && !options.cleanupInvitesAfterMaxUses) {
		await adapter.updateInvitation(invitation.id, "used");
	}

	// Track usage only if invite still active
	if (shouldCreateInviteUse) {
		await adapter.createInviteUse({
			inviteId: invitation.id,
			usedByUserId: userId,
			usedAt,
		});

		await adapter.removeUserByEmail(invitation.id, invitedUser.email);
	}

	// Fire optional hook
	if (options.onInvitationUsed) {
		try {
			await options.onInvitationUsed({
				invitedUser,
				newUser: updatedUser,
				newAccount,
			});
		} catch (e) {
			ctx.context.logger.error("Error in onInvitationUsed hook", e);
		}
	}
};

export function getMaxUses(invitation: InviteTypeWithId) {
	return invitation.infinityMaxUses ? Infinity : invitation.maxUses;
}

/**
 * Replaces placeholders in a template string with URL-encoded values.
 *
 * Placeholders should be wrapped in curly braces and match the keys provided
 * in the values object (e.g. `{email}`).
 *
 * @param template - The string containing placeholders to replace.
 * @param values - An object mapping placeholder names to their replacement values.
 * @returns The template string with all matching placeholders replaced by encoded values,
 * or `undefined` if the template is undefined.
 */
export function replacePlaceholders(
	template: string,
	values: Record<string, string | undefined>,
): string;

export function replacePlaceholders(
	template: string | undefined,
	values: Record<string, string | undefined>,
): string | undefined;

export function replacePlaceholders(
	template: string | undefined,
	values: Record<string, string | undefined>,
) {
	if (template === undefined) {
		return undefined;
	}

	return Object.entries(values).reduce(
		(result, [key, value]) =>
			result.replace(`{${key}}`, encodeURIComponent(value ?? "")),
		template,
	);
}

/**
 * Converts a string or a string array into a normalized array format.
 *
 * @returns A string array strings or a default value if the input is undefined.
 *
 * @example
 * normalizeArray("test@example.com")
 * // => ["test@example.com"]
 *
 * @example
 * normalizeArray(["a@test.com", "b@test.com"])
 * // => ["a@test.com", "b@test.com"]
 *
 * @example
 * normalizeArray(undefined)
 * // => []
 *
 * @example
 * normalizeArray(undefined, true)
 * // => undefined
 */
export function normalizeArray<T extends boolean = false>(
	email?: string | string[],
	defaultUndefined?: T,
	// Returns type string[] if defaultUndefined is false, otherwise returns string[] | undefined
): T extends true ? string[] | undefined : string[] {
	return (
		email
			? Array.isArray(email)
				? email
				: [email]
			: defaultUndefined
				? undefined
				: []
	) as never;
}

export const getDate = (span: number, unit: "sec" | "ms" = "ms") => {
	return new Date(Date.now() + (unit === "sec" ? span * 1000 : span));
};

export function redirectError(
	ctx: AuthContext,
	callbackURL: string | undefined,
	query?: Record<string, string> | undefined,
): string {
	const url = callbackURL
		? new URL(callbackURL, ctx.baseURL)
		: new URL(`${ctx.baseURL}/error`);
	if (query) {
		for (const [k, v] of Object.entries(query)) {
			url.searchParams.set(k, v);
		}
	}

	return url.href;
}

export function redirectCallback(
	ctx: AuthContext,
	callbackURL: string,
	query?: Record<string, string> | undefined,
): string {
	const url = new URL(callbackURL, ctx.baseURL);
	if (query) {
		for (const [k, v] of Object.entries(query)) {
			url.searchParams.set(k, v);
		}
	}

	return url.href;
}

export const checkPermissions = async (
	ctx: GenericEndpointContext,
	permissions: Permissions,
) => {
	const session = await getSessionFromCtx(ctx);

	if (!session?.session) {
		throw APIError.from("UNAUTHORIZED", {
			message: "Unauthorized",
			code: "UNAUTHORIZED",
		});
	}

	const adminPlugin = getPlugin<AdminPlugin>(
		"admin" satisfies AdminPlugin["id"],
		ctx.context,
	);

	if (!adminPlugin) {
		ctx.context.logger.error("Admin plugin is not set-up.");
		throw APIError.from(
			"FAILED_DEPENDENCY",
			ERROR_CODES.ADMIN_PLUGIN_IS_NOT_SET_UP,
		);
	}

	try {
		const res = await adminPlugin.endpoints.userHasPermission({
			...ctx,
			body: {
				userId: session.user.id,
				permissions: { [permissions.statement]: permissions.permissions },
			},
			returnHeaders: true,
		});

		return res.response.success;
	} catch {
		return false;
	}
};

type AdminPlugin = ReturnType<typeof admin>;

const getPlugin = <P extends BetterAuthPlugin = BetterAuthPlugin>(
	id: string,
	context: AuthContext,
) => {
	return context.options.plugins?.find((p) => p.id === id) as P | undefined;
};

export const createRedirectURL = ({
	ctx,
	invitation,
	signInUpUrl,
	customInviteUrl,
	email,
	callbackUrl,
}: {
	ctx: GenericEndpointContext;
	invitation: InviteTypeWithId;
	signInUpUrl: string;
	customInviteUrl?: string;
	email?: string;
	callbackUrl: string;
}) => {
	// Default redirect URL with query parameters
	// For private invites, we also include the email in the query params to pre-fill the sign-in/up form
	const emailQuery =
		invitation.emails && invitation.emails.length > 0
			? `&email=${encodeURIComponent(email ?? "")}`
			: "";
	const urlQuery = `signInUpUrl=${encodeURIComponent(signInUpUrl)}&callbackUrl=${encodeURIComponent(callbackUrl)}${emailQuery}`;
	let redirectUrl = `/invite/${invitation.token}?${urlQuery}`;

	if (customInviteUrl)
		redirectUrl = customInviteUrl
			.replace("{token}", invitation.token)
			.replace("{signInUpUrl}", encodeURIComponent(signInUpUrl))
			.replace("{email}", encodeURIComponent(email ?? ""))
			.replace("{callbackUrl}", encodeURIComponent(callbackUrl))
			.replace("{defaultUrlQuery}", urlQuery);

	return createFullURL({
		ctx,
		url: redirectUrl,
		includePathname: true,
	});
};

export const createFullURL = ({
	ctx,
	url,
	includePathname = false,
}: {
	ctx: GenericEndpointContext;
	url: string;
	includePathname?: boolean;
}) => {
	const realBaseURL = new URL(ctx.context.baseURL);

	const basePath = includePathname
		? (() => {
				const pathname =
					realBaseURL.pathname === "/" ? "" : realBaseURL.pathname;
				return pathname ? "" : ctx.context.options.basePath || "";
			})()
		: "";

	const pathname =
		includePathname && realBaseURL.pathname !== "/" ? realBaseURL.pathname : "";

	return new URL(
		`${pathname}${basePath}/${url.startsWith("/") ? url.slice(1) : url}`,
		realBaseURL.origin,
	);
};

export const validateCallbackUrl = (
	callbackUrl: string | undefined,
	requestUrl: string | undefined,
) => {
	if (!callbackUrl || !requestUrl) return undefined;

	try {
		const url = new URL(callbackUrl);
		const requestOrigin = new URL(requestUrl).origin;

		if (url.origin !== requestOrigin) {
			return undefined;
		}

		return callbackUrl;
	} catch {
		return undefined;
	}
};

export const resolveInviteOptions = (opts: InviteOptions) => ({
	getDate: opts.getDate ?? (() => new Date()),
	invitationTokenExpiresIn: opts.invitationTokenExpiresIn ?? 60 * 60,
	defaultShareInviterName: opts.defaultShareInviterName ?? true,
	defaultSenderResponse: opts.defaultSenderResponse ?? "token",
	defaultSenderResponseRedirect: opts.defaultSenderResponseRedirect ?? "signUp",
	defaultTokenType: opts.defaultTokenType ?? "token",
	defaultRedirectToSignIn: opts.defaultRedirectToSignIn ?? "/auth/sign-in",
	defaultRedirectToSignUp: opts.defaultRedirectToSignUp ?? "/auth/sign-up",
	canCreateInvite: opts.canCreateInvite ?? true,
	canAcceptInvite: opts.canAcceptInvite ?? true,
	canCancelInvite: opts.canCancelInvite ?? true,
	canRejectInvite: opts.canRejectInvite ?? true,
	cleanupInvitesAfterMaxUses: opts.cleanupInvitesAfterMaxUses ?? false,
	cleanupInvitesOnDecision: opts.cleanupInvitesOnDecision ?? false,
	...opts,
});

export const resolveInvitePayload = (
	body: CreateInvite,
	options: NewInviteOptions,
) => ({
	tokenType: body.tokenType ?? options.defaultTokenType,
	redirectToSignUp: body.redirectToSignUp ?? options.defaultRedirectToSignUp,
	redirectToSignIn: body.redirectToSignIn ?? options.defaultRedirectToSignIn,
	maxUses: body.maxUses ?? options.defaultMaxUses,
	expiresIn: body.expiresIn ?? options.invitationTokenExpiresIn,
	shareInviterName: body.shareInviterName ?? options.defaultShareInviterName,
	senderResponse: body.senderResponse ?? options.defaultSenderResponse,
	senderResponseRedirect:
		body.senderResponseRedirect ?? options.defaultSenderResponseRedirect,
	customInviteUrl: body.customInviteUrl ?? options.defaultCustomInviteUrl,
	redirectToAfterUpgrade:
		body.redirectToAfterUpgrade ??
		options.defaultRedirectAfterUpgrade ??
		defaultRedirectAfterUpgrade,
});

export const resolveTokenGenerator = (
	tokenType: TokensType,
	options: NewInviteOptions,
): (() => string) => {
	if (tokenType === "custom" && options.generateToken) {
		return options.generateToken;
	}

	const tokenGenerators: Record<TokensType, () => string> = {
		code: () => generateRandomString(6, "0-9", "A-Z"),
		token: () => generateId(24),
		custom: () => generateId(24), // secure fallback
	};

	return tokenGenerators[tokenType];
};
