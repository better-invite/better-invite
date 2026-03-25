import type { Metadata } from "next";
import { createMetadata } from "@/lib/metadata";

const description =
	"See a real example of the Better Invite — from invite creation to signup.";

const image = {
	url: "/showcase.png",
	width: 1200,
	height: 630,
};

export const metadata: Metadata = createMetadata({
	title: "Showcase",
	description,
	openGraph: {
		url: "/showcase",
		title: "Showcase",
		description,
		images: [image],
	},
	twitter: {
		images: [image],
		title: "Showcase",
		description,
	},
});

export default function ShowcasePage() {
	return (
		<div className="flex flex-col justify-center text-center flex-1">
			<h1 className="text-2xl font-bold mb-4">Showcase Page</h1>
			<p>This page is being build.</p>
		</div>
	);
}
