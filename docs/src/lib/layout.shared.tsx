import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { Logo } from "@/components/logo";

export function baseOptions(): BaseLayoutProps {
	return {
		nav: {
			title: (
				<div className="flex items-center gap-2">
					<Logo className="w-5 h-5" />
					<span className="hidden sm:inline select-none">BETTER-INVITE.</span>
				</div>
			),
			transparentMode: "top",
		},
		githubUrl: "https://github.com/better-invite/better-invite",
	};
}
