import type { ReactNode } from "react";
import { Link } from "react-router";
import buttonClasses, { type ButtonVariant } from "../controls/buttonClasses";

type ButtonLinkProps = {
	to: string;
	variant?: ButtonVariant;
	className?: string;
	children: ReactNode;
};

export default function ButtonLink({
	to,
	variant = "default",
	className,
	children,
}: ButtonLinkProps) {
	return (
		<Link to={to} className={buttonClasses(variant, className)}>
			{children}
		</Link>
	);
}
