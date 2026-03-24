export function getSection(path: string | undefined) {
	if (!path) return "get-started";
	const [dir] = path.split("/", 1);
	if (!dir) return "get-started";
	return (
		{
			core: "core",
			examples: "examples",
			reference: "reference",
		}[dir] ?? "get-started"
	);
}

export function formatCategoryName(category: string): string {
	return category
		.split("-")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}
