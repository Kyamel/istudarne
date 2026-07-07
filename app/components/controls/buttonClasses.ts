import { cx } from "../../lib/classes";

export type ButtonVariant = "default" | "primary" | "ghost";

const base =
	"inline-flex min-h-[42px] cursor-pointer items-center justify-center rounded-field border px-4 font-semibold no-underline transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
	default: "border-edge bg-surface text-fg hover:bg-surface-raised hover:text-fg",
	primary: "border-primary bg-primary text-white hover:border-primary-hover hover:bg-primary-hover",
	ghost: "border-transparent bg-transparent text-fg-muted hover:bg-surface-muted hover:text-fg",
};

export default function buttonClasses(variant: ButtonVariant, extra?: string) {
	return cx(base, variants[variant], extra);
}
