import { buttonVariants } from "fumadocs-ui/components/ui/button";
import { SquareArrowOutUpRight } from "lucide-react";
import Link from "next/link";

export const NpmLogo = () => (
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
