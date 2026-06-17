import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";
import { cx } from "../lib/classes";
import styles from "./Button.module.css";

export type ButtonVariant = "default" | "primary" | "ghost";

function classes(variant: ButtonVariant, extra?: string) {
	return cx(styles.button, variant === "default" ? "" : styles[variant], extra);
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: ButtonVariant;
};

export function Button({ variant = "default", className, ...props }: ButtonProps) {
	return <button className={classes(variant, className)} {...props} />;
}

type ButtonLinkProps = {
	to: string;
	variant?: ButtonVariant;
	className?: string;
	children: ReactNode;
};

export function ButtonLink({ to, variant = "default", className, children }: ButtonLinkProps) {
	return (
		<Link to={to} className={classes(variant, className)}>
			{children}
		</Link>
	);
}
