// To silence TypeScript errors
// @ts-nocheck

export type InviteOptions = {
	/**
	 * A function to generate the date
	 * @default () => new Date()
	 */
	getDate?: () => Date;
	/**
	 * A function that runs before a user creates an invite
	 *
	 * @default true
	 */
	canCreateInvite?:
		| ((data: {
				invitedUser: {
					email?: string;
					role: string;
				};
				inviterUser: UserWithRole;
				ctx: GenericEndpointContext;
		  }) => Promise<boolean> | boolean)
		| boolean
		| Permissions;
	/**
	 * A function that runs before a user accepts an invite
	 *
	 * @default true
	 */
	canAcceptInvite?:
		| ((data: {
				invitedUser: UserWithRole;
				newAccount: boolean;
		  }) => Promise<boolean> | boolean)
		| boolean
		| Permissions;
	/**
	 * A function that runs before a user cancels an invite.
	 *
	 * **Note**: regardless of this option, only the user who created the invite
	 * can cancel it.
	 *
	 * @default true
	 */
	canCancelInvite?:
		| ((data: {
				inviterUser: UserWithRole;
				invitation: InviteTypeWithId;
				ctx: GenericEndpointContext;
		  }) => Promise<boolean> | boolean)
		| boolean
		| Permissions;
	/**
	 * A function that runs before a user rejects an invite.
	 *
	 * **Note**: regardless of this option, only the invitee (user whose email
	 * matches the invite email for private invites) can reject it.
	 *
	 * @default true
	 */
	canRejectInvite?:
		| ((data: {
				inviteeUser: UserWithRole;
				invitation: InviteTypeWithId;
				ctx: GenericEndpointContext;
		  }) => Promise<boolean> | boolean)
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
	 * @default "token"
	 */
	defaultTokenType?: TokensType;
	/**
	 * The default redirect to make the user to sign up
	 *
	 * @default "/auth/sign-up"
	 */
	defaultRedirectToSignUp?: string;
	/**
	 * The default redirect to make the user to sign up
	 *
	 * @default "/auth/sign-in"
	 */
	defaultRedirectToSignIn?: string;
	/**
	 * The default redirect after upgrading role (or logging in with an invite)
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
	 * @default 1 on private invites and infinite on public invites
	 */
	defaultMaxUses?: number;
	/**
	 * How should the sender receive the token by default.
	 * (sender only receives a token if no email is provided)
	 *
	 * @default "token"
	 */
	defaultSenderResponse?: "token" | "url";
	/**
	 * Where should we redirect the user by default?
	 * (only if no email is provided)
	 *
	 * @default "signUp"
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
		request?: Request,
	) => Promise<void> | void;
	/**
	 * Send user role upgrade email. **(Deprecated, use `sendUserInvitation` instead.)**
	 *
	 * @deprecated Use `sendUserInvitation` instead.
	 */
	sendUserRoleUpgrade?: (
		data: {
			email: string;
			role: string;
			url: string;
			token: string;
		},
		request?: Request,
	) => Promise<void> | void;
	/**
	 * Number of seconds the invitation token is
	 * valid for.
	 *
	 * @default 3600 // (1 hour)
	 */
	invitationTokenExpiresIn?: number;
	/**
	 * Maximum age (in seconds) for the invitation cookie.
	 * This controls how long users have to complete the login flow
	 * before activating the token if they are not logged in.
	 *
	 * @default 600 // (10 minutes)
	 */
	inviteCookieMaxAge?: number;
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
	) => Promise<void> | void;
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
		}) => Promise<void> | void;
		/**
		 * A function that runs after a user creates an invite
		 */
		afterCreateInvite?: (data: {
			ctx: GenericEndpointContext;
			invitation: InviteTypeWithId;
		}) => Promise<void> | void;
		/**
		 * A function that runs before a user accepts an invite
		 *
		 * You can return a user object to override the invited user.
		 */
		beforeAcceptInvite?: (data: {
			ctx: GenericEndpointContext;
			invitedUser: UserWithRole;
		}) =>
			| Promise<{ user?: UserWithRole }>
			| Promise<void>
			| { user?: UserWithRole }
			| void;
		/**
		 * A function that runs after a user accepts an invite
		 */
		afterAcceptInvite?: (data: {
			ctx: GenericEndpointContext;
			invitation: InviteTypeWithId;
			invitedUser: UserWithRole;
		}) => Promise<void> | void;
		/**
		 * A function that runs before a user cancels an invite
		 */
		beforeCancelInvite?: (data: {
			ctx: GenericEndpointContext;
			invitation: InviteTypeWithId;
		}) => Promise<void> | void;
		/**
		 * A function that runs after a user cancels an invite
		 */
		afterCancelInvite?: (data: {
			ctx: GenericEndpointContext;
			invitation: InviteTypeWithId;
		}) => Promise<void> | void;
		/**
		 * A function that runs before a user rejects an invite
		 */
		beforeRejectInvite?: (data: {
			ctx: GenericEndpointContext;
			invitation: InviteTypeWithId;
		}) => Promise<void> | void;
		/**
		 * A function that runs after a user rejects an invite
		 */
		afterRejectInvite?: (data: {
			ctx: GenericEndpointContext;
			invitation: InviteTypeWithId;
		}) => Promise<void> | void;
	};
};

export type TokensType = "token" | "code" | "custom";

export type InferOptionSchema<S> =
	S extends Record<string, { fields: infer Fields }>
		? {
				[K in keyof S]?: {
					modelName?: string | undefined;
					fields?:
						| {
								[P in keyof Fields]?: string;
						  }
						| undefined;
				};
			}
		: never;

export const schema = {
	invite: {
		fields: {
			token: { type: "string", unique: true },
			createdAt: { type: "date" },
			expiresAt: { type: "date", required: true },
			maxUses: { type: "number", required: true },
			createdByUserId: {
				type: "string",
				references: { model: "user", field: "id", onDelete: "set null" },
			},
			redirectToAfterUpgrade: { type: "string", required: false },
			shareInviterName: { type: "boolean", required: true },
			email: { type: "string", required: false },
			role: { type: "string", required: true },
			newAccount: { type: "boolean", required: false }, // Only in private invites
		},
	},
	inviteUse: {
		fields: {
			inviteId: {
				type: "string",
				required: true,
				references: { model: "invite", field: "id", onDelete: "set null" },
			},
			usedAt: { type: "date", required: true },
			usedByUserId: {
				type: "string",
				required: false,
				references: { model: "user", field: "id", onDelete: "set null" },
			},
		},
	},
};

export type InviteSchema = typeof schema;

export type Permissions = {
	statement: string;
	permissions: string[];
};
