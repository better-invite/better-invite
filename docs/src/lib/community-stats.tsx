import { unstable_cache } from "next/cache";

export interface CommunityStats {
	npmDownloads: number;
	npmWeeklyHistory: number[];
	githubStars: number;
}

// Fetch NPM download stats for the last week
async function fetchNpmDownloads(): Promise<number> {
	try {
		const response = await fetch(
			"https://api.npmjs.org/downloads/point/last-week/better-invite",
			{ next: { revalidate: 3600 } }, // Cache for 1 hour
		);

		if (!response.ok) {
			console.error("Failed to fetch NPM downloads:", response.status);
			return 2_000_000; // Fallback value
		}

		const data = await response.json();
		return data.downloads || 2_000_000;
	} catch (error) {
		console.error("Error fetching NPM downloads:", error);
		return 2_000_000; // Fallback value
	}
}

// Fetch NPM weekly download history (last 6 months, aggregated by week)
async function fetchNpmWeeklyHistory(): Promise<number[]> {
	try {
		const end = new Date();
		const start = new Date();
		start.setMonth(start.getMonth() - 6);
		const fmt = (d: Date) => d.toISOString().slice(0, 10);
		const response = await fetch(
			`https://api.npmjs.org/downloads/range/${fmt(start)}:${fmt(end)}/better-invite`,
			{ next: { revalidate: 3600 } },
		);
		if (!response.ok) return [];
		const data = await response.json();
		const downloads: { day: string; downloads: number }[] = data.downloads;
		// Aggregate daily into weekly buckets
		const weeks: number[] = [];
		for (let i = 0; i < downloads.length; i += 7) {
			const week = downloads.slice(i, i + 7);
			weeks.push(week.reduce((sum, d) => sum + d.downloads, 0));
		}
		return weeks;
	} catch {
		return [];
	}
}

// Shared headers for GitHub API requests
const githubHeaders = {
	Accept: "application/vnd.github.v3+json",
	...(process.env.GITHUB_TOKEN && {
		Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
	}),
};

// Fetch GitHub repository stars
async function fetchGitHubStars(): Promise<number> {
	try {
		const repoResponse = await fetch(
			"https://api.github.com/repos/better-invite/better-invite",
			{
				next: { revalidate: 3600 },
				headers: githubHeaders,
			},
		);

		let stars = 27;
		if (repoResponse.ok) {
			const data = await repoResponse.json();
			stars = data.stargazers_count || 27;
		} else {
			console.error("Failed to fetch GitHub repo stats:", repoResponse.status);
		}

		return stars;
	} catch (error) {
		console.error("Error fetching GitHub stats:", error);
		return 27;
	}
}

// Cached function to get all community stats
export const getCommunityStats = unstable_cache(
	async (): Promise<CommunityStats> => {
		const [npmDownloads, npmWeeklyHistory, githubStars] = await Promise.all([
			fetchNpmDownloads(),
			fetchNpmWeeklyHistory(),
			fetchGitHubStars(),
		]);

		return {
			npmDownloads,
			npmWeeklyHistory,
			githubStars,
		};
	},
	["community-stats"],
	{
		revalidate: 3600, // Revalidate every hour
		tags: ["community-stats"],
	},
);

export function formatCount(num: number | null | undefined): string {
	if (num == null) return "—";
	if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
	if (num >= 1_000) return `${(num / 1_000).toFixed(num >= 10_000 ? 0 : 1)}k`;
	return num.toString();
}
