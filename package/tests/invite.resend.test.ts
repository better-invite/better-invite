import { beforeEach, expect, vi } from "vitest";
import type { InviteTypeWithId } from "../src/types";
import { defaultOptions, test } from "./helpers/better-auth";
import mock from "./helpers/mocks";

beforeEach(() => {
	vi.clearAllMocks();
});

test("resends emails for private invites", async ({ createAuth }) => {
	const { client, db, signInWithTestUser } = await createAuth({
		pluginOptions: {
			...defaultOptions,
			sendUserInvitation: mock.sendUserInvitation,
		},
	});

	const { headers } = await signInWithTestUser();

	const { error } = await client.invite.create({
		role: "user",
		email: ["test@email.com", "test2@email.com"],
		fetchOptions: {
			headers,
		},
	});

	expect(error).toBe(null);
	expect(mock.sendUserInvitation).toHaveBeenCalledTimes(2);

	vi.clearAllMocks();

	const invite = await db.findOne<InviteTypeWithId>({
		model: "invite",
		where: [
			{
				field: "emails",
				value: JSON.stringify(["test@email.com", "test2@email.com"]),
			},
		],
	});

	if (!invite) {
		throw new Error("Invite not found");
	}

	const resend = await client.invite.resend({
		token: invite.token,
		fetchOptions: {
			headers,
		},
	});

	expect(resend.error).toBe(null);

	expect(mock.sendUserInvitation).toHaveBeenCalledTimes(2);
	expect(mock.sendUserInvitation).toHaveBeenCalledWith(
		expect.objectContaining({
			email: "test@email.com",
			token: invite.token,
			role: "user",
		}),
		expect.anything(),
	);
});

test("does not resend public invites", async ({ createAuth }) => {
	const { client, signInWithTestUser } = await createAuth({
		pluginOptions: {
			...defaultOptions,
			sendUserInvitation: mock.sendUserInvitation,
		},
	});

	const { headers } = await signInWithTestUser();

	const { error, data } = await client.invite.create({
		role: "user",
		senderResponse: "token",
		fetchOptions: {
			headers,
		},
	});

	expect(error).toBe(null);

	const tokenValue = data?.message;
	if (!tokenValue) {
		throw new Error("Token value is undefined");
	}

	const resend = await client.invite.resend({
		token: tokenValue,
		fetchOptions: {
			headers,
		},
	});

	expect(resend.error).toStrictEqual({
		code: "INVALID_TOKEN",
		message: "Invalid or non-existent token",
		status: 400,
		statusText: "BAD_REQUEST",
	});
});

test("throws error when resend is used without sendUserInvitation", async ({
	createAuth,
}) => {
	const { client, db, signInWithTestUser } = await createAuth({
		pluginOptions: {
			...defaultOptions,
		},
	});

	const { headers, user } = await signInWithTestUser();

	const invite = await db.create<InviteTypeWithId>({
		model: "invite",
		data: {
			token: "test-token",
			createdByUserId: user.id,
			createdAt: new Date(),
			expiresAt: new Date(Date.now() + 1000 * 60 * 60),
			maxUses: 1,
			maxUsesPerUser: 1,
			infinityMaxUses: false,
			shareInviterName: true,
			emails: ["test@email.com"],
			role: "user",
			status: "pending",
		},
	});

	const resend = await client.invite.resend({
		token: invite.token,
		fetchOptions: {
			headers,
		},
	});

	expect(resend.error).toStrictEqual({
		code: "INVITATION_EMAIL_NOT_ENABLED",
		message: "Invitation email is not enabled",
		status: 500,
		statusText: "INTERNAL_SERVER_ERROR",
	});
});

test("handles resend email errors", async ({ createAuth }) => {
	const { client, db, signInWithTestUser } = await createAuth({
		pluginOptions: {
			...defaultOptions,
			sendUserInvitation: mock.sendUserInvitationWithError,
		},
	});

	const { headers } = await signInWithTestUser();

	const { error } = await client.invite.create({
		role: "user",
		email: "test@email.com",
		fetchOptions: {
			headers,
		},
	});

	expect(error).toStrictEqual({
		code: "ERROR_SENDING_THE_INVITATION_EMAIL",
		message: "Error sending the invitation email",
		status: 500,
		statusText: "INTERNAL_SERVER_ERROR",
	});

	const invite = await db.findOne<InviteTypeWithId>({
		model: "invite",
		where: [
			{
				field: "emails",
				value: JSON.stringify(["test@email.com"]),
			},
		],
	});

	if (!invite) {
		throw new Error("Invite not found");
	}

	const resend = await client.invite.resend({
		token: invite.token,
		fetchOptions: {
			headers,
		},
	});

	expect(resend.error).toStrictEqual({
		code: "ERROR_SENDING_THE_INVITATION_EMAIL",
		message: "Error sending the invitation email",
		status: 500,
		statusText: "INTERNAL_SERVER_ERROR",
	});
});

test("resend uses custom redirect options", async ({ createAuth }) => {
	const { client, signInWithTestUser, db } = await createAuth({
		pluginOptions: {
			...defaultOptions,
			sendUserInvitation: mock.sendUserInvitation,
		},
	});

	const { headers } = await signInWithTestUser();

	await client.invite.create({
		role: "user",
		email: "test@email.com",
		fetchOptions: {
			headers,
		},
	});

	const invite = await db.findOne<InviteTypeWithId>({
		model: "invite",
		where: [
			{
				field: "emails",
				value: JSON.stringify(["test@email.com"]),
			},
		],
	});

	if (!invite) {
		throw new Error("Invite not found");
	}

	vi.clearAllMocks();

	const resend = await client.invite.resend({
		token: invite.token,
		customInviteUrl: "https://example.com/custom-invite",
		redirectToSignUp: "/signup",
		redirectToSignIn: "/signin",
		fetchOptions: {
			headers,
		},
	});

	expect(resend.error).toBe(null);

	expect(mock.sendUserInvitation).toHaveBeenCalledWith(
		expect.objectContaining({
			email: "test@email.com",
			url: expect.stringContaining("https://example.com/custom-invite"),
		}),
		expect.anything(),
	);
});
