import Image from "next/image";
import { cn } from "@/lib/cn";

type GithubUserProps = {
	user: string;
	className?: string;
	userName?: string;
};

export function GithubUser({ user, className, userName }: GithubUserProps) {
	const href = `https://github.com/${user}`;
	const avatar = `https://avatars.githubusercontent.com/${user}`;

	return (
		<a
			href={href}
			target="_blank"
			rel="noreferrer"
			className={cn("inline-flex items-center gap-0.5 underline", className)}
		>
			<Image
				src={avatar}
				alt={`${user} avatar`}
				width={19}
				height={19}
				className="rounded-full not-prose"
			/>
			<span className="self-baseline">{userName ? userName : `@${user}`}</span>
		</a>
	);
}
