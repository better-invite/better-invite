import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { buttonVariants } from "@/components/ui/button";

export function NotFound() {
	return (
		<div className="flex flex-col items-center justify-center text-center gap-4 p-8 [grid-area:main]">
			<Logo className="w-20 h-20 mb-4 mx-auto" />
			<p className="font-semibold text-muted-foreground text-xl">404</p>
			<h1 className="mt-2 text-5xl font-semibold tracking-tight text-balance sm:text-7xl">
				Page not found
			</h1>
			<p className="mt-4 text-lg font-medium text-pretty text-muted-foreground sm:text-xl/8">
				Sorry, we couldn't find the page you're looking for.
			</p>

			<div className="flex flex-col gap-4 mt-6">
				<div className="flex items-center justify-center gap-x-6">
					<Link
						href="/docs"
						className={buttonVariants({ size: "lg", variant: "primary" })}
					>
						Documentation
					</Link>
					<Link
						href="/"
						className={buttonVariants({ size: "lg", variant: "secondary" })}
					>
						Home
					</Link>
				</div>
				<Link
					href="/"
					className={buttonVariants({ size: "lg", variant: "link" })}
				>
					<ArrowLeftIcon aria-hidden="true" />
					Go back home
				</Link>
			</div>
		</div>
	);
}
