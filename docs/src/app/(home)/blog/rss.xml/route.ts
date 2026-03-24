import { NextResponse } from "next/server";
import { getRSS } from "@/lib/rss";

export const revalidate = false;

export function GET() {
	return new NextResponse(getRSS(), {
		headers: {
			"Content-Type": "application/rss+xml; charset=utf-8",
		},
	});
}
