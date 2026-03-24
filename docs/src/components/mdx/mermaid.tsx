"use client";

import { useTheme } from "next-themes";
import panzoom, { type PanZoom } from "panzoom";
import { Suspense, use, useEffect, useId, useRef, useState } from "react";

export function Mermaid({ chart }: { chart: string }) {
	const [mounted, setMounted] = useState(false);

	useEffect(() => setMounted(true), []);

	if (!mounted) {
		return <MermaidLoading />;
	}

	return (
		<Suspense fallback={<MermaidLoading />}>
			<MermaidContent chart={chart} />
		</Suspense>
	);
}

const cache = new Map<string, Promise<unknown>>();

function cachePromise<T>(
	key: string,
	setPromise: () => Promise<T>,
): Promise<T> {
	const cached = cache.get(key);
	if (cached) return cached as Promise<T>;
	const promise = setPromise();
	cache.set(key, promise);
	return promise;
}

function MermaidContent({ chart }: { chart: string }) {
	const id = useId();
	const { resolvedTheme } = useTheme();
	const containerRef = useRef<HTMLDivElement>(null);
	const panRef = useRef<PanZoom | null>(null);

	const { default: mermaid } = use(
		cachePromise("mermaid", () => import("mermaid")),
	);

	mermaid.initialize({
		startOnLoad: false,
		securityLevel: "loose",
		fontFamily: "inherit",
		themeCSS: "margin: 1.5rem auto 0;",
		theme: resolvedTheme === "dark" ? "dark" : "default",
	});

	const { svg } = use(
		cachePromise(`${chart}-${resolvedTheme}`, () => {
			return mermaid.render(id, chart.replaceAll("\\n", "\n"));
		}),
	);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		panRef.current?.dispose();
		panRef.current = null;

		const parser = new DOMParser();
		const doc = parser.parseFromString(svg, "image/svg+xml");
		const parsedSvg = doc.documentElement;
		if (parsedSvg.tagName.toLowerCase() !== "svg") return;

		const importedSvg = document.importNode(parsedSvg, true);
		container.replaceChildren(importedSvg);
		const svgElement = container.querySelector("svg");
		if (svgElement) {
			panRef.current = panzoom(svgElement as unknown as HTMLElement, {
				zoomDoubleClickSpeed: 0,
				maxZoom: 6,
				minZoom: 0.5,
				beforeWheel: (e) => {
					const shouldIgnore = !e.altKey;
					if (!shouldIgnore) e.preventDefault();
					return shouldIgnore;
				},
				beforeMouseDown: (e) => {
					const shouldIgnore = !e.altKey;
					if (!shouldIgnore) e.preventDefault();
					return shouldIgnore;
				},
			});
		}

		return () => {
			panRef.current?.dispose();
			panRef.current = null;
		};
	}, [svg]);

	return (
		<div className="border rounded-lg my-8">
			<div
				ref={containerRef}
				style={{ overflow: "hidden", cursor: "default" }}
			/>
		</div>
	);
}

function MermaidLoading() {
	return (
		<div className="border rounded-lg my-8 p-6 text-sm text-muted-foreground">
			Loading...
		</div>
	);
}
