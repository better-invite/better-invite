import { Feed } from "feed";
import { baseUrl } from "@/lib/metadata";
import { blog } from "@/lib/source";

export function getRSS() {
	const feed = new Feed({
		title: "Better Invite Blog",
		description: "Releases, tutorials, guides, updates, and more.",
		generator: "better-invite",
		id: `${baseUrl}blog`,
		link: `${baseUrl}blog`,
		language: "en",

		image: `${baseUrl}blog.png`,
		favicon: `${baseUrl}favicon/favicon-32x32.png`,
		copyright: `All rights reserved ${new Date().getFullYear()}, Sandy`,
	});

	for (const page of blog.getPages().sort((a, b) => {
		return new Date(b.data.date).getTime() - new Date(a.data.date).getTime();
	})) {
		feed.addItem({
			id: page.url,
			title: page.data.title,
			description: page.data.description,
			image: page.data.image
				? `${baseUrl}${page.data.image.startsWith("/") ? page.data.image.slice(1) : page.data.image}`
				: undefined,
			link: `${baseUrl}${page.url.startsWith("/") ? page.url.slice(1) : page.url}`,
			date: new Date(page.data.lastModified ?? page.data.date),
			author: [{ name: page.data.author.name, link: page.data.author.github }],
		});
	}

	return feed.rss2();
}
