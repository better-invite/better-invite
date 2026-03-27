import Link from "next/link";

export default function Home() {
	return (
		<main className="container mx-auto flex flex-col gap-4 p-6">
			<h1 className="font-bold text-2xl">Hello, world.</h1>
			<p>
				This is a template for{" "}
				<Link
					href="https://www.better-invite.com"
					className="font-bold underline"
				>
					Better Invite
				</Link>{" "}
				in Next.js
			</p>
			<p>
				This template is based in{" "}
				<Link
					href="https://github.com/daveyplate/better-auth-nextjs-starter"
					className="font-bold underline"
				>
					Better Auth Starter
				</Link>{" "}
			</p>
		</main>
	);
}
