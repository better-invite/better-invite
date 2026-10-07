import { HomeLayout } from "fumadocs-ui/layouts/home";
import { baseOptions } from "@/lib/layout.shared";

export default function Layout({ children }: LayoutProps<"/">) {
	return (
		<HomeLayout
			{...baseOptions()}
			links={[
				{ text: "Documentation", url: "/docs" },
				{ text: "Showcase", url: "https://demo.better-invite.com" },
				{ text: "Blog", url: "/blog" },
				{ text: "Donate", url: "https://patreon.better-invite.com/membership" },
				{
					text: "For LLMs",
					url: "/llms.txt",
				},
			]}
		>
			{children}
		</HomeLayout>
	);
}
