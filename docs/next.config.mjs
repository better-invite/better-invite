import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
	reactStrictMode: true,
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "avatars.githubusercontent.com",
				pathname: "/**",
			},
		],
	},

	async rewrites() {
		return [
			{
				source: "/docs/:path*.mdx",
				destination: "/llms.mdx/docs/:path*",
			},
			{
				source: "/docs.mdx",
				destination: "/llms.mdx",
			},
			{
				source: "/docs/:path*.md",
				destination: "/llms.mdx/docs/:path*",
			},
		];
	},
	redirects() {
		return [
			{
				source: "/docs",
				destination: "/docs/introduction",
				permanent: true,
			},
			{
				source: "/docs/examples",
				destination: "/docs/examples/create-invite",
				permanent: true,
			},
			{
				source: "/docs/openapi",
				destination: "/docs/openapi/createInvite",
				permanent: true,
			},
		];
	},
	//! Temporary
	headers() {
		return [
			{
				source: "/showcase",
				headers: [
					{
						key: "X-Robots-Tag",
						value: "noindex, nofollow",
					},
				],
			},
		];
	},
};

export default withMDX(config);
