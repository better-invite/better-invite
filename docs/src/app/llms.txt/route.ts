import { NextResponse } from "next/server";
import { docsVersions } from "@/lib/docs-versions";
import { formatCategoryName, getSection } from "@/lib/navigation";
import { source } from "../../lib/source";

export const revalidate = false;

interface PageInfo {
	title: string;
	description: string;
	url: string;
	category: string;
}

const categoryOrder = ["get-started", "examples", "core", "reference"];

function groupPagesByCategory(pages: any[]): Map<string, PageInfo[]> {
	const grouped = new Map<string, PageInfo[]>();

	for (const page of pages) {
		// Skip openapi pages
		console.log(page);
		if (page.slugs[0] === "examples" && !page.slugs[1]) continue;

		const category = getSection(page.slugs[0]);
		const pageInfo: PageInfo = {
			title: page.data.title,
			description: page.data.description || "",
			url: `/llms.txt${page.url}.md`,
			category: category,
		};

		if (!grouped.has(category)) {
			grouped.set(category, []);
		}
		grouped.get(category)?.push(pageInfo);
	}

	return grouped;
}

export async function GET() {
	const pages = source.getPages();
	const groupedPages = groupPagesByCategory(pages);

	let content = `# Better Invite

> A Better Auth plugin for secure invitations with automatic role assignment.

`;

	content += `## Documentation Versions

This documentation is versioned. Each version may represent a different branch of the project and can contain different APIs or features.

Documentation links use the main path format (\`/docs/...\`), but they are also available under version prefixes (for example "/docs/beta/...").

When answering questions, prefer the version the user is reading from. If a version-specific URL is available, use that documentation instead of assuming the latest version.

Versions:

`;

	for (const version of docsVersions) {
		const url = version.slug ? `/docs/${version.slug}` : "/docs";
		content += `- ${version.label} - URL: ${url}/\n`;
	}

	content += "\n";
	content += "## Table of Contents";
	content += "\n\n";

	const sortedCategories = Array.from(groupedPages.keys()).sort((a, b) => {
		const ai = categoryOrder.indexOf(a);
		const bi = categoryOrder.indexOf(b);

		if (ai === -1) return 1;
		if (bi === -1) return -1;

		return ai - bi;
	});

	for (const category of sortedCategories) {
		const categoryPages = groupedPages.get(category)!;
		const formattedCategory = formatCategoryName(category);

		content += `### ${formattedCategory}\n\n`;

		for (const page of categoryPages) {
			const description = page.description ? `: ${page.description}` : "";
			content += `- [${page.title}](${page.url})${description}\n`;
		}

		content += "\n";
	}

	return new NextResponse(content, {
		headers: {
			"Content-Type": "text/markdown",
		},
	});
}
