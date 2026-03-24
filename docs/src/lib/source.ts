import { blog as blogPosts, docs } from "fumadocs-mdx:collections/server";
import { type InferPageType, loader, multiple } from "fumadocs-core/source";
import { lucideIconsPlugin } from "fumadocs-core/source/lucide-icons";
import { toFumadocsSource } from "fumadocs-mdx/runtime/server";
import { openapiPlugin, openapiSource } from "fumadocs-openapi/server";
import { formatCategoryName, getSection } from "./navigation";
import { openapi } from "./openapi";

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader(
	multiple({
		docs: docs.toFumadocsSource(),
		openapi: await openapiSource(openapi, {
			baseDir: "openapi/(generated)",
		}),
	}),
	{
		baseUrl: "/docs",
		plugins: [lucideIconsPlugin(), openapiPlugin()],
	},
);

export const blog = loader(toFumadocsSource(blogPosts, []), {
	baseUrl: "/blog",
});

export async function getLLMText(page: InferPageType<typeof source>) {
	if (page.data.type === "openapi") return "";

	const section = getSection(page.slugs[0]);
	const category = formatCategoryName(section);

	const processed = (await page.data.getText("processed")).trimStart();

	return `# ${category}: ${page.data.title}
URL: ${page.url}
Source: https://raw.githubusercontent.com/better-invite/better-invite/refs/heads/main/docs/content/docs/${page.path}

${page.data.description}

---

${processed}`;
}
