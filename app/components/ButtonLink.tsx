import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import buttonClasses, { type ButtonVariant } from "./buttonClasses";

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
