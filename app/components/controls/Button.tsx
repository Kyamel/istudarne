import type { ButtonHTMLAttributes } from "react";
import buttonClasses, { type ButtonVariant } from "./buttonClasses";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: ButtonVariant;
};

export default function Button({ variant = "default", className, ...props }: ButtonProps) {
	return <button className={buttonClasses(variant, className)} {...props} />;
}
