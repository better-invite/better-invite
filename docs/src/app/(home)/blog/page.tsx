import { Rss } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { createMetadata } from "@/lib/metadata";
import { blog } from "@/lib/source";
import { formatDate } from "@/lib/utils";

const description = "Releases, tutorials, guides, updates, and more.";

const image = {
	url: "/blog.png",
	width: 1200,
	height: 630,
};

export const metadata: Metadata = createMetadata({
	title: "Blog",
	description,
	openGraph: {
		url: "/blog",
		title: "Blog",
		description,
		images: [image],
	},
	twitter: {
		images: [image],
		title: "Blog",
		description,
	},
});

export default function Home() {
	const posts = blog.getPages().sort((a, b) => {
		return new Date(b.data.date).getTime() - new Date(a.data.date).getTime();
	});

	return (
		<main className="flex-1 w-full">
			<div className="w-full max-w-3xl mx-auto px-4 pt-16 text-center">
				<h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
					Blog
				</h1>
				<p className="mt-4 text-muted-foreground text-lg">
					Releases, tutorials, guides, updates, and more.
				</p>
			</div>

			<div className="w-full max-w-6xl mx-auto px-4 py-8">
				<h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-8">
					Latest Posts
				</h1>

				<div className="grid gap-10 md:grid-cols-2">
					{posts.map((post) => (
						<Link
							key={post.url}
							href={post.url}
							className="group flex flex-col overflow-hidden rounded-2xl border transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
						>
							{post.data.image && (
								<div className="relative aspect-1200/630 w-full overflow-hidden">
									<Image
										src={
											post.data.image.startsWith("/")
												? post.data.image
												: `/${post.data.image}`
										}
										alt={post.data.title}
										fill
										sizes="(max-width: 1024px) 100vw, 50vw"
										className="object-cover transition-transform duration-500 group-hover:scale-150 "
									/>
								</div>
							)}

							<div className="flex flex-col flex-1 p-8">
								<h3 className="text-2xl font-semibold mb-3">
									{post.data.title}
								</h3>

								<p className="text-base text-muted-foreground mb-6 line-clamp-3">
									{post.data.description}
								</p>

								<time
									dateTime={String(post.data.date)}
									className="mt-auto text-sm text-muted-foreground"
								>
									{formatDate(post.data.date)}
								</time>
							</div>
						</Link>
					))}
				</div>

				<div className="mt-8 flex justify-center">
					<Link
						href="/blog/rss.xml"
						className="inline-flex items-center gap-2 rounded-full border px-5 py-2 text-sm font-medium transition hover:bg-muted"
					>
						<Rss className="size-4" />
						RSS
					</Link>
				</div>
			</div>
		</main>
	);
}
