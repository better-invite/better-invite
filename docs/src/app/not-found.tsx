import { HomeLayout } from "fumadocs-ui/layouts/home";
import { NotFound } from "@/components/not-found";
import { baseOptions } from "@/lib/layout.shared";

export default function NotFoundPage() {
	return (
		<HomeLayout
			{...baseOptions()}
			links={[
				{ text: "Documentation", url: "/docs" },
				{ text: "Showcase", url: "/showcase" },
				{ text: "Blog", url: "/blog" },
				{
					type: "menu",
					text: "For LLMs",
					items: [
						{
							text: "llms.txt",
							description: "Outline of the documentation",
							url: "/llms.txt",
						},
						{
							text: "llms-full.txt",
							description: "Full text of the documentation",
							url: "/llms-full.txt",
						},
					],
				},
			]}
		>
			<div className="flex-1 flex items-center justify-center">
				<NotFound />
			</div>
		</HomeLayout>
	);
}
