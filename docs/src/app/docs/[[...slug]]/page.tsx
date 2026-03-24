import {
	createFileSystemGeneratorCache,
	createGenerator,
} from "fumadocs-typescript";
import { AutoTypeTable } from "fumadocs-typescript/ui";
import { Accordion, Accordions } from "fumadocs-ui/components/accordion";
import { Callout } from "fumadocs-ui/components/callout";
import { GithubInfo } from "fumadocs-ui/components/github-info";
import { Step, Steps } from "fumadocs-ui/components/steps";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { TypeTable } from "fumadocs-ui/components/type-table";
import {
	DocsBody,
	DocsDescription,
	DocsPage,
	DocsTitle,
	PageLastUpdate,
} from "fumadocs-ui/layouts/docs/page";
import { createRelativeLink } from "fumadocs-ui/mdx";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LLMCopyButton, ViewOptions } from "@/components/ai/page-actions";
import { APIMethod } from "@/components/api-method";
import DatabaseTable from "@/components/database-table";
import { Feedback, FeedbackBlock } from "@/components/feedback/client";
import { GithubButton } from "@/components/github-button";
import { GithubUser } from "@/components/github-user";
import { Mermaid } from "@/components/mdx/mermaid";
import { NpmButton } from "@/components/npm-button";
import { onBlockFeedbackAction, onPageFeedbackAction } from "@/lib/github";
import { createMetadata, getPageImage } from "@/lib/metadata";
import { source } from "@/lib/source";
import { getMDXComponents } from "@/mdx-components";

const generator = createGenerator({
	// set a cache, necessary for serverless platform like Vercel
	cache: createFileSystemGeneratorCache(".next/fumadocs-typescript"),
});

export default async function Page(props: PageProps<"/docs/[[...slug]]">) {
	const params = await props.params;
	const page = source.getPage(params.slug);
	if (!page) notFound();

	if (page.data.type === "openapi") {
		const { APIPage } = await import("@/components/api-page");
		return (
			<DocsPage full>
				<h1 className="text-[1.75em] font-semibold">{page.data.title}</h1>

				<DocsBody>
					<APIPage {...page.data.getAPIPageProps()} />
				</DocsBody>
			</DocsPage>
		);
	}

	const gitConfig = {
		user: "better-invite",
		repo: "better-invite",
		branch: "main",
	};
	const npmName = "better-invite";

	const lastModifiedTime = page.data.lastModified;
	const MDX = page.data.body;

	return (
		<DocsPage toc={page.data.toc} full={page.data.full}>
			<DocsTitle>{page.data.title}</DocsTitle>
			<DocsDescription className="mb-0">
				{page.data.description}
			</DocsDescription>
			<div className="flex flex-row gap-2 items-center border-b pb-6">
				<LLMCopyButton markdownUrl={`${page.url}.mdx`} />
				<ViewOptions
					markdownUrl={`${page.url}.mdx`}
					// update it to match your repo
					githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/docs/content/docs/${page.path}`}
				/>
				<GithubButton
					label="Source"
					username={gitConfig.user}
					repository={gitConfig.repo}
				/>
				<NpmButton packageName={npmName} />
			</div>
			<DocsBody>
				<MDX
					components={getMDXComponents({
						// this allows you to link to other pages with relative file paths
						a: createRelativeLink(source, page),
						Step,
						Steps,
						Callout,
						Tabs,
						Tab,
						APIMethod,
						GithubInfo: (props) => (
							<GithubInfo
								owner={gitConfig.user}
								repo={gitConfig.repo}
								{...props}
							/>
						),
						TypeTable,
						Accordions,
						Accordion,
						FeedbackBlock: ({ children, ...props }) => (
							<FeedbackBlock {...props} onSendAction={onBlockFeedbackAction}>
								{children}
							</FeedbackBlock>
						),
						GithubUser,
						DatabaseTable,
						Mermaid,
						AutoTypeTable: (props) => (
							<AutoTypeTable {...props} generator={generator} />
						),
					})}
				/>
			</DocsBody>
			<Feedback onSendAction={onPageFeedbackAction} />
			{lastModifiedTime && <PageLastUpdate date={lastModifiedTime} />}
		</DocsPage>
	);
}

export async function generateStaticParams() {
	return source.generateParams();
}

export async function generateMetadata(
	props: PageProps<"/docs/[[...slug]]">,
): Promise<Metadata> {
	const params = await props.params;
	const page = source.getPage(params.slug);
	if (!page) notFound();

	const description =
		page.data.description ?? "The plugin to invite users to your app";

	const image = {
		url: getPageImage(page).url,
		width: 1200,
		height: 630,
	};

	return createMetadata({
		title: page.data.title,
		description,
		openGraph: {
			url: `/docs/${page.slugs.join("/")}`,
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
