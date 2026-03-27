import { Resend } from "resend";
import EmailVerification from "@/components/emails/email-verification";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendEmailVerification({
	name,
	email,
	url,
}: {
	name: string;
	email: string;
	url: string;
}) {
	await resend.emails.send({
		from: "Better Invite Starter <noreply@demo.better-invite.com>",
		to: [email],
		subject: "Verify your email address",
		react: EmailVerification({ name, url }),
	});
}

export async function sendPasswordReset({
	name,
	email,
	url,
}: {
	name: string;
	email: string;
	url: string;
}) {
	await resend.emails.send({
		from: "Better Invite Starter <noreply@demo.better-invite.com>",
		to: [email],
		subject: "Reset your password",
		react: EmailVerification({ name, url }),
	});
}
