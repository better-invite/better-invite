import { EmailTemplate } from "@daveyplate/better-auth-ui/server";

interface EmailVerificationProps {
	name: string;
	url: string;
}

const EmailVerification = ({ name, url }: EmailVerificationProps) =>
	EmailTemplate({
		action: "Verify your email",
		content: (
			<>
				<p>{`Hello ${name},`}</p>
				<p>Click the button below to verify your email address.</p>
			</>
		),
		heading: "Verify Email",
		siteName: "Better Invite Template",
		baseUrl: "https://demo.better-invite.com",
		url,
	});

EmailVerification.PreviewProps = {
	name: "test",
	url: "https://link.com",
} as EmailVerificationProps;

export default EmailVerification;
