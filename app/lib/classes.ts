import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines conditional class names and resolves conflicting Tailwind classes.
 *
 * Use this helper when building reusable components that have default styles
 * but also accept a custom `className` prop from the caller.
 *
 * Example:
 * cx("p-2 text-sm", isActive && "bg-primary", className)
 *
 * If conflicting Tailwind classes are provided, the last one wins:
 * cx("p-2", "p-4") // returns "p-4"
 */
export function cx(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
