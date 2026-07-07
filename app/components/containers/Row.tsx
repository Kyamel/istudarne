import type { ReactNode } from "react";
import { cx } from "../../lib/classes";

/* Horizontal flex row used as layout glue so pages never need a styled <div>. */
type RowProps = {
	children: ReactNode;
	justify?: "start" | "between" | "end" | "center";
	wrap?: boolean;
	gap?: "sm" | "md";
};

const justifyClasses = {
	start: "justify-start",
	between: "justify-between",
	end: "justify-end",
	center: "justify-center",
};

export default function Row({ children, justify = "start", wrap = true, gap = "md" }: RowProps) {
	return (
		<div
			className={cx(
				"flex items-center",
				wrap && "flex-wrap",
				justifyClasses[justify],
				gap === "sm" ? "gap-2.5" : "gap-3",
			)}
		>
			{children}
		</div>
	);
}
