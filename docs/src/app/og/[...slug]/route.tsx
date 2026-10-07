import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";
import { docsVersions, resolveVersionFromSlug } from "@/lib/docs-versions";
import { getPageImage } from "@/lib/metadata";
import { getSourceFor } from "@/lib/source";
import { getVersionedStaticParams } from "@/lib/static-params";
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
	return getVersionedStaticParams(docsVersions, (versionSlug) =>
		getSourceFor(versionSlug)
			.getPages()
			.map((page) => getPageImage(page).segments),
	);
}
