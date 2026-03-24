import { InlineTOC } from "fumadocs-ui/components/inline-toc";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GithubUser } from "@/components/github-user";
import { createMetadata } from "@/lib/metadata";
import { blog } from "@/lib/source";
import { formatDate } from "@/lib/utils";
import { getMDXComponents } from "@/mdx-components";

export default async function Page(props: {
	params: Promise<{ slug: string }>;
}) {
	const params = await props.params;
	const page = blog.getPage([params.slug]);

	if (!page) notFound();
	const Mdx = page.data.body;

	return (
		<div className="relative min-h-screen">
			<div className="relative mx-auto max-w-3xl px-4 pb-24 pt-12">
				<header className="text-center">
					<h1 className="text-3xl md:text-5xl font-semibold tracking-tight">
						{page.data.title}
					</h1>
					{page.data.description && (
						<p className="mt-3 text-muted-foreground">
							{page.data.description}
						</p>
					)}
					<div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
						{page.data.author.github ? (
							<GithubUser
								userName={page.data.author.name}
								user={page.data.author.github}
								className="text-foreground"
							/>
						) : (
							page.data.author.name
						)}
						<span>•</span>
						<time dateTime={String(page.data.date)}>
							{formatDate(page.data.date)}
						</time>
					</div>
				</header>

				<div className="my-6 flex items-center gap-3 text-sm text-muted-foreground">
					<Link
						href="/blog"
						className="inline-flex items-center gap-1 hover:underline"
					>
						<ArrowLeftIcon className="size-4" />
						Back to blogs
					</Link>
					<div className="h-px flex-1 bg-border" />
				</div>

				<div className="mb-8">
					<InlineTOC items={page.data.toc} />
				</div>

				<article className="prose prose-neutral dark:prose-invert mx-auto max-w-none">
					<Mdx
						components={getMDXComponents({
							Tabs,
							Tab,
						})}
					/>
				</article>
			</div>
		</div>
	);
}

export function generateStaticParams() {
	return blog.getPages().map((page) => ({
		slug: page.slugs[0],
	}));
}

export async function generateMetadata(
	props: PageProps<"/blog/[slug]">,
): Promise<Metadata> {
	const params = await props.params;
	const page = blog.getPage([params.slug]);
	if (!page) notFound();

	const description =
		page.data.description ?? "Releases, tutorials, guides, updates, and more.";

	const image = {
		url: `/${page.data.image.startsWith("/") ? page.data.image.slice(1) : page.data.image}`,
		width: 1200,
		height: 630,
	};

	return createMetadata({
		title: page.data.title,
		description,
		openGraph: {
			url: `/blog/${page.slugs.join("/")}`,
			title: page.data.title,
			description,
			images: [image],
		},
		twitter: {
			images: [image],
			title: page.data.title,
			description,
		},
	});
}
