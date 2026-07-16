import type { ReactNode } from "react";
import { cx } from "../../lib/classes";

type StatusTagProps = {
	children: ReactNode;
	tone: "ok" | "pending";
};

export default function StatusTag({ children, tone }: StatusTagProps) {
	return (
		<span
			className={cx(
				"rounded-full px-2.5 py-1 text-[0.78rem] font-bold whitespace-nowrap",
				tone === "ok" ? "bg-success-soft text-success" : "bg-warning-soft text-warning",
			)}
		>
			{children}
		</span>
	);
}
