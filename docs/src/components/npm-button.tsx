import { buttonVariants } from "fumadocs-ui/components/ui/button";
import { SquareArrowOutUpRight } from "lucide-react";
import Link from "next/link";

export const NpmLogo = ({ color = false }: { color?: boolean }) =>
	color ? (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			role="img"
			viewBox="0 0 128 128"
			className="size-3.5"
		>
			<title>npm</title>
			<path
				fill="#cb3837"
				d="M0 7.062C0 3.225 3.225 0 7.062 0h113.88c3.838 0 7.063 3.225 7.063 7.062v113.88c0 3.838-3.225 7.063-7.063 7.063H7.062c-3.837 0-7.062-3.225-7.062-7.063zm23.69 97.518h40.395l.05-58.532h19.494l-.05 58.581h19.543l.05-78.075l-78.075-.1l-.1 78.126z"
			/>
			<path
				fill="#fff"
				d="M25.105 65.52V26.512H40.96c8.72 0 26.274.034 39.008.075l23.153.075v77.866H83.645v-58.54H64.057v58.54H25.105z"
			/>
		</svg>
	) : (
		<svg
			role="img"
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			className="size-3.5"
		>
			<title>npm</title>
			<path
				d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113z"
				className="fill-black dark:fill-white"
			/>
		</svg>
	);

export const NpmButton = ({
	packageName,
	label = "Npm",
	noExternalIcon = false,
}: {
	packageName: string;
	label?: string;
	noExternalIcon?: boolean;
}) => {
	return (
		<Link
			href={`https://www.npmjs.com/package/${packageName}`}
			target="_blank"
			rel="noopener noreferrer"
			className={buttonVariants({
				variant: "secondary",
				size: "sm",
			})}
		>
			<NpmLogo />
			{label}
			{!noExternalIcon && (
				<SquareArrowOutUpRight className="size-3.5 text-muted-foreground" />
			)}
		</Link>
	);
};
NpmButton.displayName = "NpmButton";
