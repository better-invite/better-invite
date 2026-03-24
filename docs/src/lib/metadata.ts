import type { InferPageType } from "fumadocs-core/source";
import type { Metadata } from "next/types";
import type { source } from "./source";

export function createMetadata(override: Metadata): Metadata {
	return {
		...override,
		openGraph: {
			title: override.title ?? undefined,
			description: override.description ?? undefined,
			url: "https://better-invite.vercel.app",
			images: "/og.png",
			siteName: "Better Invite",
			...override.openGraph,
		},
		twitter: {
			card: "summary_large_image",
			title: override.title ?? undefined,
			description: override.description ?? undefined,
			images: "/og.png",
			...override.twitter,
		},
		icons: [
			{
				media: "(prefers-color-scheme: light)",
				url: "/favicon/icon-light.png",
				href: "/favicon/icon-light.png",
			},
			{
				media: "(prefers-color-scheme: dark)",
				url: "/favicon/icon-dark.png",
				href: "/favicon/icon-dark.png",
			},
			{
				media: "(max-width: 0px)", // If the browser supports media, it will not use the normal favicon
				url: "/favicon/favicon.ico", // This is only here as a fallback if the browser doesn't support media
				href: "/favicon/favicon.ico",
				sizes: "any",
			},
		],
		alternates: {
			types: {
				"application/rss+xml": [
					{
						title: "Better Invite Blog",
						url: "https://better-invite.vercel.app/blog/rss.xml",
					},
				],
			},
			...override.alternates,
		},
	};
}

export function getPageImage(page: InferPageType<typeof source>) {
	const segments = [...page.slugs, "image.webp"];

	return {
		segments,
		url: `/og/${segments.join("/")}`,
	};
}

export const baseUrl =
	process.env.NODE_ENV === "development" ||
	!process.env.VERCEL_PROJECT_PRODUCTION_URL
		? new URL("http://localhost:3000")
		: new URL(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
