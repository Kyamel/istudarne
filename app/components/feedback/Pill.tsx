import type { ReactNode } from "react";
import { cx } from "../../lib/classes";

type PillProps = {
	children: ReactNode;
	className?: string;
};

export default function Pill({ children, className }: PillProps) {
	return (
		<span
			className={cx(
				"inline-flex rounded-full bg-secondary-soft px-2.5 py-1 text-[0.78rem] font-bold text-secondary",
				className,
			)}
		>
			{children}
		</span>
	);
}
