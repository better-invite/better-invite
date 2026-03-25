import Link from "next/link";
import { Banner } from "@/components/banner";
import { GithubButton } from "@/components/github-button";
import { NpmButton } from "@/components/npm-button";

export default function HomePage() {
	return (
		<>
			<Banner
				variant="rainbow"
				id="banner-better-invite"
				rainbowSpeed="7s"
				className="flex-col relative z-0"
				rainbowColors={[
					"rgba(20,20,20,0.95)",
					"rgba(40,40,40,0.9)",
					"rgba(70,70,70,0.85)",
					"rgba(120,120,120,0.75)",
				]}
			>
				<span className="font-medium flex gap-2 text-sm text-zinc-700 dark:text-zinc-300">
					<span className="font-semibold">
						Better Auth Invite Plugin is now called <b>Better Invite</b>!
					</span>
					{/*<span className="text-zinc-400 hidden md:block">|</span>
          <Link
            href="/blog/better-invite"
            className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 hidden dark:hover:text-blue-300 transition-colors md:block"
          >
            Go see the blog →
          </Link>*/}
				</span>
				{/*<Link
          href="/blog/better-invite"
          className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 text-xs dark:hover:text-blue-300 transition-colors md:hidden"
        >
          Go see the blog →
        </Link>*/}
			</Banner>
			<div className="flex flex-col justify-center text-center flex-1">
				<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
					Better Invite
				</h1>
				<p className="mt-4 text-base text-muted-foreground">
					A small plugin for inviting users to your Better Auth app.
				</p>
				<div className="flex justify-center mt-7">
					<div className="flex w-fit px-6 gap-9 py-4 rounded-[10px] border border-white/10 dark:bg-white/5 bg-black/5 shadow-[0_0_30px_#ffffff33] dark:shadow-[0_0_30px_#ffffff40]">
						<code className="md:text-sm text-xs font-geist flex items-center gap-0.5">
							<span className="select-none">
								<span className="text-sky-500">git:</span>
								<span className="text-red-400">(main)</span>
								<span> &gt;</span>
							</span>
							<span className="dark:text-white text-black">
								pnpm add
								<span className="dark:text-fuchsia-300 text-fuchsia-800">
									{" "}
									better-invite
								</span>
							</span>
						</code>
						<div className="flex gap-2 items-center">
							<NpmButton packageName="better-invite" label="" noExternalIcon />
							<GithubButton
								username="better-invite"
								repository="better-invite"
								label=""
								noExternalIcon
							/>
						</div>
					</div>
				</div>
				<div className="flex items-center justify-center gap-3 mt-7">
					<Link
						href="/docs"
						className="inline-flex h-11 items-center justify-center rounded-xl bg-foreground px-5 text-md font-medium text-background shadow-sm transition hover:opacity-90"
					>
						Docs
					</Link>
					<Link
						href="/showcase"
						className="inline-flex h-11 items-center justify-center rounded-xl border px-5 text-md font-medium shadow-sm transition hover:bg-muted"
					>
						Showcase
					</Link>
				</div>
			</div>
		</>
	);
}
