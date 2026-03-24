import type { SVGProps } from "react";

export const Logo = (props: SVGProps<SVGSVGElement>) => {
	return (
		<svg
			width="45"
			height="60"
			viewBox="0 0 45 60"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-label="Better Invite logo"
			role="img"
			{...props}
		>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M0 60V45H15V30H30V45H45V60H30 15 0ZM30 15H15V30H0V15 0H15 30 45V15 30H30V15Z"
				fill="currentColor"
			/>
		</svg>
	);
};
