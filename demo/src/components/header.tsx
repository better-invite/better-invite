import { GitHubIcon, UserButton } from "@daveyplate/better-auth-ui";
import Link from "next/link";
import { Logo } from "./logo";
import { ModeToggle } from "./mode-toggle";
import { Button } from "./ui/button";

export function Header() {
	return (
		<header className="sticky top-0 z-50 flex h-12 justify-between border-b bg-background/60 px-safe-or-4 backdrop-blur md:h-14 md:px-safe-or-6">
			<Link href="/" className="flex items-center gap-2">
				<Logo className="w-5 h-5" />
				BETTER-INVITE. STARTER
			</Link>

			<div className="flex items-center gap-2">
				<Link
					href="https://github.com/better-invite/better-invite/tree/main/demo"
					target="_blank"
				>
					<Button variant="outline" size="icon" className="size-8 rounded-full">
						<GitHubIcon />
					</Button>
				</Link>

				<ModeToggle />
				<UserButton size="icon" />
			</div>
		</header>
	);
}
