import type { Awaitable, GenericEndpointContext } from "better-auth";
import type { InferOptionSchema, UserWithRole } from "better-auth/plugins";
import type { Tokens } from "./constants";
import type { InviteSchema } from "./schema";
import type { resolveInviteOptions } from "./utils";

export type InviteOptions = {
	/**
	 * A function to generate the date
	 * @default () => new Date()
	 */
	getDate?: () => Date;
	/**
	 * A function that runs before a user creates an invite
	 *
	 * @example ```ts
	 * async canCreateInvite({ ctx }) {
	 *   const canCreateInvite = await hasPermission(ctx, 'create-invite');
	 *   return canCreateInvite
	 * }
	 * ```
	 *
	 * @default true
	 */
	canCreateInvite?:
		| ((data: {
				invitedUser: {
					email?: string | string[];
					role: string;
				};
				inviterUser: UserWithRole;
				ctx: GenericEndpointContext;
		  }) => Awaitable<boolean>)
		| boolean
		| Permissions;
	/**
	 * A function that runs before a user accepts an invite
	 *
	 * @example ```ts
	 * async canAcceptInvite({ ctx }) {
	 *   const canAcceptInvite = await hasPermission(ctx, 'accept-invite');
	 *   return canAcceptInvite
	 * }
	 * ```
	 *
	 * @default true
	 */
	canAcceptInvite?:
		| ((data: {
				invitedUser: UserWithRole;
				newAccount: boolean;
		  }) => Awaitable<boolean>)
		| boolean
		| Permissions;
	/**
	 * A function that runs before a user cancels an invite.
	 *
	 * Note: regardless of this option, only the user who created the invite
	 * can cancel it.
	 *
	 * @default true
	 */
	canCancelInvite?:
		| ((data: {
				inviterUser: UserWithRole;
				invitation: InviteTypeWithId;
				ctx: GenericEndpointContext;
		  }) => Awaitable<boolean>)
		| boolean
		| Permissions;
	/**
	 * A function that runs before a user rejects an invite.
	 *
	 * Note: regardless of this option, only the invitee (user whose email
	 * matches the invite email for private invites) can reject it.
	 *
	 * @default true
	 */
	canRejectInvite?:
		| ((data: {
				inviteeUser: UserWithRole;
				invitation: InviteTypeWithId;
				ctx: GenericEndpointContext;
		  }) => Awaitable<boolean>)
		| boolean
		| Permissions;
	/**
	 * A function to generate a custom token
	 */
	generateToken?: () => string;
	/**
	 * The default token type, can be:
	 * - Token: () => generateId(24)
	 * - Code: () => generateRandomString(6, "0-9", "A-Z")
	 * - Custom: generateToken(invitedUser) (needs options.generateToken)
	 *
	 * @default token
	 */
	defaultTokenType?: TokensType;
	/**
	 * The default redirect to make the user to sign up
	 * {callbackUrl} will be replaced by the actual callbackUrl in the request body.
	 *
	 * @default /auth/sign-up
	 */
	defaultRedirectToSignUp?: string;
	/**
	 * The default redirect to make the user to sign up
	 * {callbackUrl} will be replaced by the actual callbackUrl in the request body.
	 *
	 * @default /auth/sign-in
	 */
	defaultRedirectToSignIn?: string;
	/**
	 * The URL to redirect the user to after upgrading their role (after accepting the invite).
	 * @deprecated Use `redirectToAfterUpgrade` in the request body of `invite.create()` instead.
	 */
	defaultRedirectAfterUpgrade?: string;
	/**
	 * Whether the inviter's name should be shared with the invitee by default.
	 *
	 * When enabled, the person receiving the invitation will see
	 * the name of the user who created the invitation.
	 *
	 * @default true
	 */
	defaultShareInviterName?: boolean;
	/**
	 * Max times an invite can be used
	 * If not defined and maxUsesPerUser is defined, maxUses will be infinite.
	 * @default 1 on private invites and infinite on public invites
	 */
	defaultMaxUses?: number;
	/**
	 * Max times an invite can be used by the same user
	 * Use `Infinity` for unlimited uses per user.
	 * Only works for private invites, public invites are always unlimited per user.
	 * @default Infinity
	 */
	defaultMaxUsesPerUser?: number;
	/**
	 * How should the sender receive the token by default.
	 * (sender only receives a token if no email is provided)
	 *
	 * @default token
	 */
	defaultSenderResponse?: "token" | "url";
	/**
	 * Where should we redirect the user by default?
	 * (only if no email is provided)
	 *
	 * @default signUp
	 */
	defaultSenderResponseRedirect?: "signUp" | "signIn";
	/**
	 * Send email to the user with the invite link.
	 */
	sendUserInvitation?: (
		data: {
			email: string;
			name?: string;
			role: string;
			url: string;
			token: string;
			newAccount: boolean;
		},
		/**
		 * The request object
		 */
		request?: Request,
	) => Awaitable<void>;
	/**
	 * Number of seconds the invitation token is
	 * valid for.
	 * @default 1 hour (60 * 60)
	 */
	invitationTokenExpiresIn?: number;
	/**
	 * Maximum age (in seconds) for the invitation cookie.
	 * This controls how long users have to complete the login flow
	 * before accepting the token if they are not logged in.
	 *
	 * @default 600 (10 minutes)
	 */
	inviteCookieMaxAge?: number;
	/**
	 * Delete invitations when a decision is made (rejected, canceled).
	 *
	 * @default false
	 */
	cleanupInvitesOnDecision?: boolean;
	/**
	 * Delete invitations after they reach max uses.
	 *
	 * @default false
	 */
	cleanupInvitesAfterMaxUses?: boolean;
	/**
	 * Keep the invite after the last rejection.
	 * If set to false, the value of `cleanupInvitesOnDecision` will be used to determine if the invite should be deleted or marked as rejected.
	 *
	 * @default false
	 */
	keepInviteAfterLastRejection?: boolean;
	/**
	 * The user will be redirected here to accept their invite
	 * Use {token}, {callbackUrl} and {email}, this will be replaced with their values
	 */
	defaultCustomInviteUrl?: string;
	/**
	 * A callback function that is triggered
	 * when a invite is used.
	 */
	onInvitationUsed?: (
		data: {
			invitedUser: UserWithRole;
			newUser: UserWithRole;
			newAccount: boolean;
		},
		request?: Request,
	) => Awaitable<void>;
	/**
	 * Custom schema for the invite plugin
	 */
	schema?: InferOptionSchema<InviteSchema>;
	/**
	 * Hooks for the invite plugin
	 */
	inviteHooks?: {
		/**
		 * A function that runs before a user creates an invite
		 */
		beforeCreateInvite?: (data: {
			ctx: GenericEndpointContext;
		}) => Awaitable<void>;
		/**
		 * A function that runs after a user creates an invite
		 */
		afterCreateInvite?: (data: {
			ctx: GenericEndpointContext;
			invitations: InviteTypeWithId[];
		}) => Awaitable<void>;
		/**
		 * A function that runs before a user accepts an invite
		 *
		 * You can return a user object to override the invited user.
		 *
		 * @example
		 * ```ts
		 * beforeAcceptInvite: async ({ invitedUser }) => {
		 * 	return {
		 * 		user: {
		 * 			...invitedUser,
		 * 			name: 'test',
		 * 		}
		 * 	}
		 * }
		 * ```
		 */
		beforeAcceptInvite?: (data: {
			ctx: GenericEndpointContext;
			invitedUser: UserWithRole;
		}) => Awaitable<{ user?: UserWithRole }> | Awaitable<void>;
		/**
		 * A function that runs after a user accepts an invite
		 */
		afterAcceptInvite?: (data: {
			ctx: GenericEndpointContext;
			invitation: InviteTypeWithId;
			invitedUser: UserWithRole;
		}) => Awaitable<void>;
		/**
		 * A function that runs before a user cancels an invite
		 */
		beforeCancelInvite?: (data: {
			ctx: GenericEndpointContext;
			invitation: InviteTypeWithId;
		}) => Awaitable<void>;
		/**
		 * A function that runs after a user cancels an invite
		 */
		afterCancelInvite?: (data: {
			ctx: GenericEndpointContext;
			invitation: InviteTypeWithId;
		}) => Awaitable<void>;
		/**
		 * A function that runs before a user rejects an invite
		 */
		beforeRejectInvite?: (data: {
			ctx: GenericEndpointContext;
			invitation: InviteTypeWithId;
		}) => Awaitable<void>;
		/**
		 * A function that runs after a user rejects an invite
		 */
		afterRejectInvite?: (data: {
			ctx: GenericEndpointContext;
			invitation: InviteTypeWithId;
		}) => Awaitable<void>;
	};
};

export type NewInviteOptions = ReturnType<typeof resolveInviteOptions>;

export type InviteType = {
	token: string;
	createdByUserId: string;
	createdAt: Date;
	expiresAt: Date;
	maxUses: number;
	maxUsesPerUser?: number;
	infinityMaxUses: boolean;
	shareInviterName: boolean;
	/**
	 * @deprecated Use emails
	 */
	email?: string;
	emails?: string[];
	role: string;
	callbackUrl?: string;
	status: InvitationStatus;
};

export type InviteTypeWithId = InviteType & {
	id: string;
};

export type TokensType = (typeof Tokens)[number];

export type InviteCookie = {
	token?: string;
	callbackUrl?: string;
};

export type InviteUseType = {
	inviteId: string;
	usedByUserId: string;
	usedAt: Date;
};

export type InviteUseTypeWithId = InviteUseType & {
	id: string;
};

export type Permissions = {
	statement: string;
	permissions: string[];
};

export type InvitationStatus =
	| "pending"
	| "rejected"
	| "canceled"
	| "used"
	| "expired";
