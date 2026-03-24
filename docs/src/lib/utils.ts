export function formatDate(date: Date) {
	const d = new Date(date);
	return d
		.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		})
		.replace(",", "");
}
