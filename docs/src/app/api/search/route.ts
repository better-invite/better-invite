import { createFromSource } from "fumadocs-core/search/server";
import { source, sourceBeta } from "@/lib/source";

const searchSource = {
	getPages: () => [...source.getPages(), ...sourceBeta.getPages()],
	getPageTree: (locale?: string) => {
		const tree = source.getPageTree(locale);
		const betaTree = sourceBeta.getPageTree(locale);
		return {
			...tree,
			children: [...tree.children, ...betaTree.children],
		};
	},
};

export const { GET } = createFromSource(searchSource as any, {
	// https://docs.orama.com/docs/orama-js/supported-languages
	language: "english",
});
