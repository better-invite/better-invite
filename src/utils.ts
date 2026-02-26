import { base64Url } from "@better-auth/utils/base64";
import { createHMAC } from "@better-auth/utils/hmac";
import {
	type AuthContext,
	type BetterAuthPlugin,
	type CookieOptions,
	type GenericEndpointContext,
	generateId,
	type InternalLogger,
	type Session,
	type Status,
	type statusCodes,
	type User,
} from "better-auth";
import { getSessionFromCtx } from "better-auth/api";
import {
	generateRandomString,
	signJWT,
	symmetricEncodeJWT,
} from "better-auth/crypto";
import { parseUserOutput } from "better-auth/db";
import {
	type admin,
	createAuthMiddleware,
	type UserWithRole,
} from "better-auth/plugins";
import type { InviteAdapter } from "./adapter";
import type { CreateInvite } from "./body";
import { ERROR_CODES } from "./constants";
import type {
	afterUpgradeTypes,
	InviteOptions,
	InviteTypeWithId,
	NewInviteOptions,
	Permissions,
	TokensType,
} from "./types";

export const resolveInviteOptions = (
	opts: InviteOptions,
): NewInviteOptions => ({
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
	redirectToAfterUpgrade:
		body.redirectToAfterUpgrade ?? options.defaultRedirectAfterUpgrade,
	shareInviterName: body.shareInviterName ?? options.defaultShareInviterName,
	senderResponse: body.senderResponse ?? options.defaultSenderResponse,
	senderResponseRedirect:
		body.senderResponseRedirect ?? options.defaultSenderResponseRedirect,
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

export const consumeInvite = async ({
	ctx,
	invitation,
	invitedUser,
	options,
	userId,
	timesUsed,
	token,
	session,
	newAccount,
	error,
	adapter,
}: {
	ctx: GenericEndpointContext;
	invitation: InviteTypeWithId;
	invitedUser: UserWithRole;
	options: NewInviteOptions;
	userId: string;
	timesUsed: number;
	token: string;
	session: Session;
	newAccount: boolean;
	error: (
		httpErrorCode: keyof typeof statusCodes | Status,
		errorMessage: string,
		urlErrorCode: string,
	) => void;
	adapter: InviteAdapter;
}) => {
	if (invitation.email && invitation.email !== invitedUser.email) {
		throw error("BAD_REQUEST", ERROR_CODES.INVALID_EMAIL, "INVALID_EMAIL");
	}

	if (invitation.status !== "pending" && invitation.status !== undefined) {
		throw error("BAD_REQUEST", ERROR_CODES.INVALID_TOKEN, "INVALID_TOKEN");
	}

	const canAcceptInviteOptions =
		typeof options.canAcceptInvite === "function"
			? await options.canAcceptInvite({ invitedUser, newAccount })
			: options.canAcceptInvite;
	const canAcceptInvite =
		typeof canAcceptInviteOptions === "object"
			? await exports.checkPermissions(ctx, canAcceptInviteOptions) // fix vitest errors with vi.spyOn (https://github.com/vitest-dev/vitest/issues/6551)
			: canAcceptInviteOptions;

	if (!canAcceptInvite) {
		throw error(
			"BAD_REQUEST",
			ERROR_CODES.CANT_ACCEPT_INVITE,
			"CANT_ACCEPT_INVITE",
		);
	}

	await ctx.context.adapter.update({
		model: "user",
		where: [{ field: "id", value: userId }],
		update: {
			role: invitation.role,
		},
	});

	const updatedUser = {
		...invitedUser,
		role: invitation.role,
	};
	/**
	 * Update the session cookie with the new user data
	 */
	await setSessionCookie(ctx, {
		session,
		user: updatedUser,
	});

	const usedAt = options.getDate();

	const isLastUse = timesUsed === invitation.maxUses - 1;
	const shouldCleanup = isLastUse && options.cleanupInvitesAfterMaxUses;
	const shouldCreateInviteUse = !shouldCleanup;

	if (shouldCleanup) {
		await adapter.deleteInviteUses(invitation.id);
		await adapter.deleteInvitation(token);
	}

	if (isLastUse && !options.cleanupInvitesAfterMaxUses) {
		await adapter.updateInvitation(invitation.id, "used");
	}

	if (shouldCreateInviteUse) {
		await adapter.createInviteUse({
			inviteId: invitation.id,
			usedByUserId: userId,
			usedAt,
		});
	}

	// After all the logic, we run onInvitationUsed
	if (options.onInvitationUsed) {
		try {
			await Promise.resolve(
				options.onInvitationUsed({
					invitedUser,
					newUser: updatedUser,
					newAccount,
				}),
			);
		} catch (e) {
			ctx.context.logger.error("Error sending the invitation email", e);
		}
	}
};

export const redirectToAfterUpgrade = async ({
	ctx,
	invitation,
}: afterUpgradeTypes) => {
	const redirectUrl = createRedirectAfterUpgradeURL(invitation);

	if (!redirectUrl) return;

	throw ctx.redirect(redirectCallback(ctx.context, redirectUrl));
};

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
	console.log("CHECKING PERMISSIONS!");
	const session = ctx.context.session;
	if (!session?.session) {
		throw ctx.error("UNAUTHORIZED");
	}

	const adminPlugin = getPlugin<AdminPlugin>(
		"admin" satisfies AdminPlugin["id"],
		ctx.context,
	);

	if (!adminPlugin) {
		ctx.context.logger.error("Admin plugin is not set-up.");
		throw ctx.error("FAILED_DEPENDENCY", {
			message: ERROR_CODES.ADMIN_PLUGIN_IS_NOT_SET_UP,
		});
	}

	try {
		return await adminPlugin.endpoints.userHasPermission({
			...ctx,
			body: {
				userId: session.user.id,
				permissions: { [permissions.statement]: permissions.permissions },
			},
			returnHeaders: true,
		});
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

type Success<T> = {
	data: T;
	error: null;
};

type Failure<E> = {
	data: null;
	error: E;
};

export type Result<T, E = Error> = Success<T> | Failure<E>;

export async function tryCatch<T, E = Error>(
	promise: Promise<T>,
): Promise<Result<T, E>> {
	try {
		const data = await promise;
		return { data, error: null };
	} catch (error) {
		return { data: null, error: error as E };
	}
}

export const createRedirectAfterUpgradeURL = (invitation: InviteTypeWithId) => {
	return invitation.redirectToAfterUpgrade?.replace(
		"{token}",
		invitation.token,
	);
};

export const createRedirectURL = ({
	ctx,
	invitation,
	callbackURL,
}: {
	ctx: GenericEndpointContext;
	invitation: InviteTypeWithId;
	callbackURL: string;
}) => {
	if (ctx.body.inviteUrlType === "api" || !ctx.body.customInviteUrl) {
		return `${ctx.context.baseURL}/invite/${invitation.token}?callbackURL=${encodeURIComponent(callbackURL)}`;
	}

	return ctx.body.customInviteUrl
		.replace("{token}", invitation.token)
		.replace("{callbackURL}", encodeURIComponent(callbackURL));
};

// https://github.com/better-auth/better-auth/blob/08ff06d3319dc1472f24844378a9e1f572323b90/packages/better-auth/src/api/routes/session.ts#L501

export const optionalSessionMiddleware = createAuthMiddleware(async (ctx) => {
	const session = await getSessionFromCtx(ctx);

	return {
		session,
	};
});

// https://github.com/better-auth/better-auth/blob/canary/packages/better-auth/src/cookies/index.ts

// Cookie size constants based on browser limits
const ALLOWED_COOKIE_SIZE = 4096;
// Estimated size of an empty cookie with all attributes
// (name, path, domain, secure, httpOnly, sameSite, expires/maxAge)
const ESTIMATED_EMPTY_COOKIE_SIZE = 200;
const CHUNK_SIZE = ALLOWED_COOKIE_SIZE - ESTIMATED_EMPTY_COOKIE_SIZE;

interface Cookie {
	name: string;
	value: string;
	options: CookieOptions;
}

type Chunks = Record<string, string>;

/**
 * Parse cookies from the request headers
 */
function parseCookiesFromContext(
	ctx: GenericEndpointContext,
): Record<string, string> {
	const cookieHeader = ctx.headers?.get("cookie");
	if (!cookieHeader) {
		return {};
	}

	const cookies: Record<string, string> = {};
	const pairs = cookieHeader.split("; ");

	for (const pair of pairs) {
		const [name, ...valueParts] = pair.split("=");
		if (name && valueParts.length > 0) {
			cookies[name] = valueParts.join("=");
		}
	}

	return cookies;
}

/**
 * Extract the chunk index from a cookie name
 */
function getChunkIndex(cookieName: string): number {
	const parts = cookieName.split(".");
	const lastPart = parts[parts.length - 1];
	const index = parseInt(lastPart || "0", 10);
	return Number.isNaN(index) ? 0 : index;
}

/**
 * Read all existing chunks from cookies
 */
function readExistingChunks(
	cookieName: string,
	ctx: GenericEndpointContext,
): Chunks {
	const chunks: Chunks = {};
	const cookies = parseCookiesFromContext(ctx);

	for (const [name, value] of Object.entries(cookies)) {
		if (name.startsWith(cookieName)) {
			chunks[name] = value;
		}
	}

	return chunks;
}

/**
 * Get the full session data by joining all chunks
 */
function joinChunks(chunks: Chunks): string {
	const sortedKeys = Object.keys(chunks).sort((a, b) => {
		const aIndex = getChunkIndex(a);
		const bIndex = getChunkIndex(b);
		return aIndex - bIndex;
	});

	return sortedKeys.map((key) => chunks[key]).join("");
}

/**
 * Split a cookie value into chunks if needed
 */
function chunkCookie(
	storeName: string,
	cookie: Cookie,
	chunks: Chunks,
	logger: InternalLogger,
): Cookie[] {
	const chunkCount = Math.ceil(cookie.value.length / CHUNK_SIZE);

	if (chunkCount === 1) {
		chunks[cookie.name] = cookie.value;
		return [cookie];
	}

	const cookies: Cookie[] = [];
	for (let i = 0; i < chunkCount; i++) {
		const name = `${cookie.name}.${i}`;
		const start = i * CHUNK_SIZE;
		const value = cookie.value.substring(start, start + CHUNK_SIZE);
		cookies.push({ ...cookie, name, value });
		chunks[name] = value;
	}

	logger.debug(`CHUNKING_${storeName.toUpperCase()}_COOKIE`, {
		message: `${storeName} cookie exceeds allowed ${ALLOWED_COOKIE_SIZE} bytes.`,
		emptyCookieSize: ESTIMATED_EMPTY_COOKIE_SIZE,
		valueSize: cookie.value.length,
		chunkCount,
		chunks: cookies.map((c) => c.value.length + ESTIMATED_EMPTY_COOKIE_SIZE),
	});

	return cookies;
}

/**
 * Get all cookies that should be cleaned (removed)
 */
function getCleanCookies(
	chunks: Chunks,
	cookieOptions: CookieOptions,
): Record<string, Cookie> {
	const cleanedChunks: Record<string, Cookie> = {};
	for (const name in chunks) {
		cleanedChunks[name] = {
			name,
			value: "",
			options: { ...cookieOptions, maxAge: 0 },
		};
	}
	return cleanedChunks;
}

/**
 * Create a session store for handling cookie chunking.
 * When session data exceeds 4KB, it automatically splits it into multiple cookies.
 *
 * Based on next-auth's SessionStore implementation.
 * @see https://github.com/nextauthjs/next-auth/blob/27b2519b84b8eb9cf053775dea29d577d2aa0098/packages/next-auth/src/core/lib/cookie.ts
 */
const storeFactory =
	(storeName: string) =>
	(
		cookieName: string,
		cookieOptions: CookieOptions,
		ctx: GenericEndpointContext,
	) => {
		const chunks = readExistingChunks(cookieName, ctx);
		const logger = ctx.context.logger;

		return {
			/**
			 * Get the full session data by joining all chunks
			 */
			getValue(): string {
				return joinChunks(chunks);
			},

			/**
			 * Check if there are existing chunks
			 */
			hasChunks(): boolean {
				return Object.keys(chunks).length > 0;
			},

			/**
			 * Chunk a cookie value and return all cookies to set (including cleanup cookies)
			 */
			chunk(value: string, options?: Partial<CookieOptions>): Cookie[] {
				// Start by cleaning all existing chunks
				const cleanedChunks = getCleanCookies(chunks, cookieOptions);
				// Clear the chunks object
				for (const name in chunks) {
					delete chunks[name];
				}
				const cookies: Record<string, Cookie> = cleanedChunks;

				// Create new chunks
				const chunked = chunkCookie(
					storeName,
					{
						name: cookieName,
						value,
						options: { ...cookieOptions, ...options },
					},
					chunks,
					logger,
				);

				// Update with new chunks
				for (const chunk of chunked) {
					cookies[chunk.name] = chunk;
				}

				return Object.values(cookies);
			},

			/**
			 * Get cookies to clean up all chunks
			 */
			clean(): Cookie[] {
				const cleanedChunks = getCleanCookies(chunks, cookieOptions);
				// Clear the chunks object
				for (const name in chunks) {
					delete chunks[name];
				}
				return Object.values(cleanedChunks);
			},

			/**
			 * Set all cookies in the context
			 */
			setCookies(cookies: Cookie[]): void {
				for (const cookie of cookies) {
					ctx.setCookie(cookie.name, cookie.value, cookie.options);
				}
			},
		};
	};

export const createSessionStore = storeFactory("Session");

export async function setCookieCache(
	ctx: GenericEndpointContext,
	session: {
		// biome-ignore lint/suspicious/noExplicitAny: Session can have custom parameters
		session: Session & Record<string, any>;
		user: User;
	},
	dontRememberMe: boolean,
) {
	const shouldStoreSessionDataInCookie =
		ctx.context.options.session?.cookieCache?.enabled;

	if (shouldStoreSessionDataInCookie) {
		const filteredSession = Object.entries(session.session).reduce(
			(acc, [key, value]) => {
				const fieldConfig =
					ctx.context.options.session?.additionalFields?.[key];
				if (!fieldConfig || fieldConfig.returned !== false) {
					acc[key] = value;
				}
				return acc;
			},
			// biome-ignore lint/suspicious/noExplicitAny: Session can have custom parameters
			{} as Record<string, any>,
		);

		// Apply field filtering to user data
		const filteredUser = parseUserOutput(ctx.context.options, session.user);

		// Compute version
		const versionConfig = ctx.context.options.session?.cookieCache?.version;
		let version = "1"; // default version
		if (versionConfig) {
			if (typeof versionConfig === "string") {
				version = versionConfig;
			} else if (typeof versionConfig === "function") {
				const result = versionConfig(session.session, session.user);
				version = result instanceof Promise ? await result : result;
			}
		}

		const sessionData = {
			session: filteredSession,
			user: filteredUser,
			updatedAt: Date.now(),
			version,
		};

		const options = {
			...ctx.context.authCookies.sessionData.attributes,
			maxAge: dontRememberMe
				? undefined
				: ctx.context.authCookies.sessionData.attributes.maxAge,
		};

		const expiresAtDate = getDate(options.maxAge || 60, "sec").getTime();
		const strategy =
			ctx.context.options.session?.cookieCache?.strategy || "compact";

		let data: string;

		if (strategy === "jwe") {
			// Use JWE strategy (JSON Web Encryption) with A256CBC-HS512 + HKDF
			data = await symmetricEncodeJWT(
				sessionData,
				ctx.context.secret,
				"better-auth-session",
				options.maxAge || 60 * 5,
			);
		} else if (strategy === "jwt") {
			// Use JWT strategy with HMAC-SHA256 signature (HS256), no encryption
			data = await signJWT(
				sessionData,
				ctx.context.secret,
				options.maxAge || 60 * 5,
			);
		} else {
			// Use compact strategy (base64url + HMAC, no JWT spec overhead)
			// Also handles legacy "base64-hmac" for backward compatibility
			data = base64Url.encode(
				JSON.stringify({
					session: sessionData,
					expiresAt: expiresAtDate,
					signature: await createHMAC("SHA-256", "base64urlnopad").sign(
						ctx.context.secret,
						JSON.stringify({
							...sessionData,
							expiresAt: expiresAtDate,
						}),
					),
				}),
				{
					padding: false,
				},
			);
		}

		// Check if we need to chunk the cookie (only if it exceeds 4093 bytes)
		if (data.length > 4093) {
			const sessionStore = createSessionStore(
				ctx.context.authCookies.sessionData.name,
				options,
				ctx,
			);

			const cookies = sessionStore.chunk(data, options);
			sessionStore.setCookies(cookies);
		} else {
			const sessionStore = createSessionStore(
				ctx.context.authCookies.sessionData.name,
				options,
				ctx,
			);

			if (sessionStore.hasChunks()) {
				const cleanCookies = sessionStore.clean();
				sessionStore.setCookies(cleanCookies);
			}

			ctx.setCookie(ctx.context.authCookies.sessionData.name, data, options);
		}
	}
}

export async function setSessionCookie(
	ctx: GenericEndpointContext,
	session: {
		// biome-ignore lint/suspicious/noExplicitAny: Session can have custom parameters
		session: Session & Record<string, any>;
		user: User;
	},
	dontRememberMe?: boolean | undefined,
	overrides?: Partial<CookieOptions> | undefined,
) {
	const dontRememberMeCookie = await ctx.getSignedCookie(
		ctx.context.authCookies.dontRememberToken.name,
		ctx.context.secret,
	);
	// if dontRememberMe is not set, use the cookie value
	dontRememberMe =
		dontRememberMe !== undefined ? dontRememberMe : !!dontRememberMeCookie;

	const options = ctx.context.authCookies.sessionToken.attributes;
	const maxAge = dontRememberMe
		? undefined
		: ctx.context.sessionConfig.expiresIn;
	await ctx.setSignedCookie(
		ctx.context.authCookies.sessionToken.name,
		session.session.token,
		ctx.context.secret,
		{
			...options,
			maxAge,
			...overrides,
		},
	);

	if (dontRememberMe) {
		await ctx.setSignedCookie(
			ctx.context.authCookies.dontRememberToken.name,
			"true",
			ctx.context.secret,
			ctx.context.authCookies.dontRememberToken.attributes,
		);
	}
	await setCookieCache(ctx, session, dontRememberMe);
	ctx.context.setNewSession(session);
	/**
	 * If secondary storage is enabled, store the session data in the secondary storage
	 * This is useful if the session got updated and we want to update the session data in the
	 * secondary storage
	 */
	if (ctx.context.options.secondaryStorage) {
		await ctx.context.secondaryStorage?.set(
			session.session.token,
			JSON.stringify({
				user: session.user,
				session: session.session,
			}),
			Math.floor(
				(new Date(session.session.expiresAt).getTime() - Date.now()) / 1000,
			),
		);
	}
}
