import { readFile } from "node:fs/promises";
import type { ImageResponseOptions } from "next/server";
import type { ReactNode } from "react";
import { baseUrl } from "@/lib/metadata";

export interface GenerateProps {
	title: ReactNode;
	description?: ReactNode;
}

const font = readFile("./src/lib/og/Geist-Regular.ttf").then((data) => ({
	name: "Geist",
	data,
	weight: 400 as const,
}));
const fontBold = readFile("./src/lib/og/Geist-Bold.ttf").then((data) => ({
	name: "Geist",
	data,
	weight: 600 as const,
}));

type Weight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
type Style = "normal" | "italic";
interface FontOptions {
	data: Buffer | ArrayBuffer;
	name: string;
	weight?: Weight;
	style?: Style;
	lang?: string;
}

let cachedFonts: Promise<FontOptions[]> | null = null;

function getCachedFonts() {
	if (!cachedFonts) {
		cachedFonts = Promise.all([font, fontBold]);
	}
	return cachedFonts;
}

export async function getImageResponseOptions(): Promise<ImageResponseOptions> {
	return {
		width: 1200,
		height: 630,
		fonts: await getCachedFonts(),
	};
}

export function generate({ title, description }: GenerateProps) {
	return (
		<div
			style={{
				width: 1200,
				height: 630,
				display: "flex",
				flexDirection: "column",
				justifyContent: "flex-end",
				color: "white",
				backgroundImage: `url(${baseUrl.href}background.png)`,
				padding: "52px 58px 99px",
			}}
		>
			<div
				style={{
					width: 482,
					display: "flex",
					flexDirection: "column",
					gap: 16,
				}}
			>
				<div
					style={{
						fontSize: 96,
						fontWeight: 600,
						lineHeight: 0.74,
						textAlign: "left",
					}}
				>
					{title}
				</div>

				{description ? (
					<div
						style={{
							fontSize: 20,
							lineHeight: 1.3,
							color: "#949494",
							letterSpacing: "-0.01em",
						}}
					>
						{description}
					</div>
				) : null}
			</div>
		</div>
	);
}
