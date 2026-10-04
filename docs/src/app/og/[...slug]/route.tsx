import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";
import { resolveVersionFromSlug } from "@/lib/docs-versions";
import { getPageImage } from "@/lib/metadata";
import { getSourceFor } from "@/lib/source";
import { getImageResponseOptions, generate as MetadataImage } from "./generate";

export const revalidate = false;

export async function GET(
	_req: Request,
	{ params }: RouteContext<"/og/[...slug]">,
) {
	const { slug } = await params;
	const { version, relSlug } = resolveVersionFromSlug(slug);
	const page = getSourceFor(version.slug).getPage(relSlug.slice(0, -1));
	if (!page) notFound();

	return new ImageResponse(
		<MetadataImage
			title={page.data.title}
			description={page.data.description}
		/>,
		await getImageResponseOptions(),
	);
}

export function generateStaticParams(): {
	slug: string[];
}[] {
	return [null, "beta"].flatMap((versionSlug) => {
		const source = getSourceFor(versionSlug);
		return source.getPages().map((page) => ({
			slug: [
				...(versionSlug ? [versionSlug] : []),
				...getPageImage(page).segments,
			],
		}));
	});
}
