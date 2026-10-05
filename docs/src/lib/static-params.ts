type VersionEntry = { slug: string | null };

export function getVersionedStaticParams(
	versions: VersionEntry[],
	getSlugs: (versionSlug: string | null) => string[][],
	prefix: string[] = [],
) {
	return versions.flatMap(({ slug: versionSlug }) =>
		getSlugs(versionSlug).map((slug) => ({
			slug: [...prefix, ...(versionSlug ? [versionSlug] : []), ...slug],
		})),
	);
}

export function getLlmsStaticParams(
	versions: VersionEntry[],
	getSlugs: (versionSlug: string | null) => string[][],
) {
	return getVersionedStaticParams(versions, getSlugs, ["docs"]).flatMap(
		({ slug }) => {
			const last = slug.at(-1);
			if (!last) return [{ slug }];
			return [{ slug }, { slug: [...slug.slice(0, -1), `${last}.md`] }];
		},
	);
}
