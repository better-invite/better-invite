import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { BookText, Network, PanelsTopLeft } from "lucide-react";
import { baseOptions } from "@/lib/layout.shared";
import { source } from "@/lib/source";

export default function Layout({ children }: LayoutProps<"/docs">) {
	return (
		<DocsLayout
			tree={source.getPageTree()}
			{...baseOptions()}
			sidebar={{
				tabs: [
					{
						title: "Docs",
						description: "Get started with the plugin",
						url: "/docs",
						icon: <BookText size="20" />,
					},
					{
						title: "Examples",
						description: "Examples and guides",
						url: "/docs/examples",
						icon: <PanelsTopLeft size="20" />,
					},
					{
						title: "OpenAPI",
						description: "Examples and guides",
						url: "/docs/openapi",
						icon: <Network size="20" />,
					},
				],
			}}
		>
			{children}
		</DocsLayout>
	);
}
