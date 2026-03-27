import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "Better Auth Next.js Starter",
		short_name: "Better Auth Starter",
		description:
			"Better Auth Next.js Starter with Postgres, Drizzle, shadcn/ui and Tanstack Query",
		start_url: "/",
		display: "standalone",
		background_color: "#fff",
		theme_color: "#fff",
		icons: [
			{
				src: "/favicon.ico",
				sizes: "any",
				type: "image/x-icon",
			},
		],
	};
}
