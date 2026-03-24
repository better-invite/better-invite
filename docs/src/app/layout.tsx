import { RootProvider } from "fumadocs-ui/provider/next";
import type { Metadata } from "next";
import "./global.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import localFont from "next/font/local";
import { baseUrl, createMetadata } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
	verification: {
		google: "2_Rk36ZAi2agX8jVuzvGnG_mgC_4NSyeeQlTfyXoIdA",
	},
	title: {
		default: "Better Invite",
		template: "%s | Better Invite",
	},
	description:
		"A Better Auth plugin for secure invitations and automatic role assignment.",
	metadataBase: baseUrl,
});

const geist = localFont({
	src: "../lib/og/Geist-Regular.ttf",
	variable: "--font-geist",
	weight: "400",
	style: "normal",
});

export default function Layout({ children }: LayoutProps<"/">) {
	return (
		<html lang="en" className={geist.variable} suppressHydrationWarning>
			<body className="flex flex-col min-h-screen">
				<RootProvider>
					{children}
					<SpeedInsights />
					<Analytics />
				</RootProvider>
			</body>
		</html>
	);
}
