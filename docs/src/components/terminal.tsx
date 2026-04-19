"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

type Segment = {
	text: string;
	className?: string;
};

type TerminalProps = {
	segments: Segment[];
	commandToCopy?: string;
	showPrompt?: boolean;
};

export function Terminal({
	segments,
	commandToCopy,
	showPrompt = true,
}: TerminalProps) {
	const [copied, setCopied] = useState(false);

	const fullCommand = commandToCopy || segments.map((s) => s.text).join(" ");

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(fullCommand);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("Copy failed", err);
		}
	};

	return (
		<div className="w-fit overflow-hidden rounded-lg border border-neutral-200/80 bg-neutral-50 shadow-lg dark:border-white/10 dark:bg-neutral-900">
			{/* Header */}
			<div className="flex items-center gap-2 border-b border-neutral-200/80 bg-neutral-100/80 px-4 py-2.5 dark:border-white/5 dark:bg-white/5">
				<div className="flex gap-1.5">
					<span className="h-3 w-3 rounded-full bg-red-400/80" />
					<span className="h-3 w-3 rounded-full bg-yellow-400/80" />
					<span className="h-3 w-3 rounded-full bg-green-400/80" />
				</div>
				<span className="ml-2 text-xs text-neutral-500">Terminal</span>
			</div>

			{/* Command */}
			<button
				type="button"
				onClick={handleCopy}
				className="group flex w-full items-center justify-between gap-6 px-5 py-4 hover:bg-neutral-100/60 dark:hover:bg-white/5 cursor-pointer"
			>
				<code className="flex items-center gap-1 font-mono text-xs md:text-sm">
					{showPrompt && (
						<>
							<span className="select-none text-emerald-500">~</span>
							<span className="select-none text-sky-500">$</span>
						</>
					)}

					{segments.map((seg) => (
						<span key={seg.text} className={seg.className}>
							{seg.text}
						</span>
					))}
				</code>

				{copied ? (
					<Check className="h-4 w-4 text-emerald-500" />
				) : (
					<Copy className="h-4 w-4" />
				)}
			</button>
		</div>
	);
}
