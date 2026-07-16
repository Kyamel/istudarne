import type { ReactNode } from "react";
import { cx } from "../../lib/classes";

/* Vertical grid stack used as layout glue so pages never need a styled <div>. */
type StackProps = {
	children: ReactNode;
	gap?: "sm" | "md" | "lg";
};

const gaps = { sm: "gap-2", md: "gap-3.5", lg: "gap-[18px]" };

export default function Stack({ children, gap = "md" }: StackProps) {
	return <div className={cx("grid", gaps[gap])}>{children}</div>;
}
