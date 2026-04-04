import { beforeEach, expect, vi } from "vitest";
import type { InviteTypeWithId } from "../src/types";
import { defaultOptions, test } from "./helpers/better-auth";
import mock from "./helpers/mocks";
import { createUser } from "./helpers/users";

beforeEach(() => {
	vi.clearAllMocks();
});

test("list invites requires a session", async ({ createAuth }) => {
	const { client } = await createAuth({
		pluginOptions: {
			...defaultOptions,
		},
	});

	const res = await client.invite.list({
		query: {},
	});

	expect(res.data).toBeNull();
	expect(res.error).toEqual(
		expect.objectContaining({
			status: 401,
		}),
	);
});

test("list invites returns empty when the user has issued none", async ({
	createAuth,
}) => {
	const { client, signInWithTestUser } = await createAuth({
		pluginOptions: {
			...defaultOptions,
		},
	});

	const { headers } = await signInWithTestUser();

	const res = await client.invite.list({
		query: {},
		fetchOptions: { headers },
	});

	expect(res.error).toBe(null);
	expect(res.data).toEqual({
		total: 0,
		invitations: [],
		limit: undefined,
		offset: undefined,
	});
});

test("list invites returns invitations created by the signed-in user", async ({
	createAuth,
}) => {
	const { client, db, signInWithTestUser } = await createAuth({
		pluginOptions: {
			...defaultOptions,
		},
	});

	const { headers, user } = await signInWithTestUser();

	const created = await client.invite.create({
		role: "user",
		senderResponse: "token",
		fetchOptions: { headers },
	});

	expect(created.error).toBe(null);
	const token = created.data?.message;
	if (!token) {
		throw new Error("Token value is undefined");
	}

	const row = await db.findOne<InviteTypeWithId>({
		model: "invite",
		where: [{ field: "token", value: token }],
	});
	if (!row) {
		throw new Error("Invite not found");
	}

	const res = await client.invite.list({
		query: {},
		fetchOptions: { headers },
	});

	expect(res.error).toBe(null);
	expect(res.data?.total).toBe(1);
	expect(res.data?.invitations).toHaveLength(1);
	expect(res.data?.invitations[0]).toEqual(
		expect.objectContaining({
			id: row.id,
			token,
			role: "user",
			createdByUserId: user.id,
			status: "pending",
		}),
	);
});

test("list invites does not include invitations from other users", async ({
	createAuth,
}) => {
	const { client, db, signInWithTestUser, signInWithUser } = await createAuth({
		pluginOptions: {
			...defaultOptions,
		},
	});

	const other = {
		email: "other-lister@test.com",
		role: "user",
		name: "Other Lister",
		password: "12345678",
	};
	await createUser(other, db);

	const { headers: myHeaders } = await signInWithTestUser();
	const { headers: otherHeaders } = await signInWithUser(
		other.email,
		other.password,
	);

	const mine = await client.invite.create({
		role: "user",
		senderResponse: "token",
		fetchOptions: { headers: myHeaders },
	});
	expect(mine.error).toBe(null);

	const theirs = await client.invite.create({
		role: "admin",
		senderResponse: "token",
		fetchOptions: { headers: otherHeaders },
	});
	expect(theirs.error).toBe(null);

	const res = await client.invite.list({
		query: {},
		fetchOptions: { headers: myHeaders },
	});

	expect(res.error).toBe(null);
	expect(res.data?.total).toBe(1);
	expect(res.data?.invitations).toHaveLength(1);
	expect(res.data?.invitations[0]?.role).toBe("user");
});

test("list invites search narrows by email", async ({ createAuth }) => {
	const { client, signInWithTestUser } = await createAuth({
		pluginOptions: {
			...defaultOptions,
			sendUserInvitation: mock.sendUserInvitation,
		},
	});

	const { headers } = await signInWithTestUser();

	await client.invite.create({
		role: "user",
		email: "alpha-search@list.test",
		fetchOptions: { headers },
	});
	await client.invite.create({
		role: "user",
		email: "beta-search@list.test",
		fetchOptions: { headers },
	});

	const res = await client.invite.list({
		query: {
			searchValue: "alpha-search",
			searchField: "email",
			searchOperator: "contains",
		},
		fetchOptions: { headers },
	});

	expect(res.error).toBe(null);
	expect(res.data?.total).toBe(1);
	expect(res.data?.invitations).toHaveLength(1);
	expect(res.data?.invitations[0]).toEqual(
		expect.objectContaining({
			emails: expect.arrayContaining(["alpha-search@list.test"]),
		}),
	);
});

test("list invites applies limit, offset, and total", async ({
	createAuth,
}) => {
	const { client, signInWithTestUser } = await createAuth({
		pluginOptions: {
			...defaultOptions,
		},
	});

	const { headers } = await signInWithTestUser();

	for (let i = 0; i < 3; i++) {
		const { error } = await client.invite.create({
			role: "user",
			senderResponse: "token",
			fetchOptions: { headers },
		});
		expect(error).toBe(null);
	}

	const page = await client.invite.list({
		query: { limit: 2, offset: 0 },
		fetchOptions: { headers },
	});

	expect(page.error).toBe(null);
	expect(page.data?.invitations.length).toBeGreaterThanOrEqual(1);

	const rest = await client.invite.list({
		query: { limit: 2, offset: 2 },
		fetchOptions: { headers },
	});

	expect(rest.error).toBe(null);
	expect(rest.data?.invitations.length).toBeGreaterThanOrEqual(1);
});

test("list invites marks past expiresAt as expired in the response", async ({
	createAuth,
}) => {
	const { client, db, signInWithTestUser } = await createAuth({
		pluginOptions: {
			...defaultOptions,
		},
	});

	const { headers } = await signInWithTestUser();

	const created = await client.invite.create({
		role: "user",
		senderResponse: "token",
		fetchOptions: { headers },
	});
	expect(created.error).toBe(null);
	const token = created.data?.message;
	if (!token) {
		throw new Error("Token value is undefined");
	}

	const row = await db.findOne<InviteTypeWithId>({
		model: "invite",
		where: [{ field: "token", value: token }],
	});
	if (!row) {
		throw new Error("Invite not found");
	}

	const past = new Date(Date.now() - 60_000);
	await db.update({
		model: "invite",
		where: [{ field: "id", value: row.id }],
		update: { expiresAt: past },
	});

	const res = await client.invite.list({
		query: {},
		fetchOptions: { headers },
	});

	expect(res.error).toBe(null);
	expect(res.data?.invitations[0]).toEqual(
		expect.objectContaining({
			id: row.id,
			status: "expired",
			expiresAt: past,
		}),
	);
});
