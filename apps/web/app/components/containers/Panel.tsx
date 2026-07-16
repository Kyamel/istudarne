import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "../../lib/classes";

type PanelProps = HTMLAttributes<HTMLElement> & {
	title?: string;
	accent?: "none" | "primary" | "secondary";
	children: ReactNode;
};

const accents = {
	none: "",
	primary: "border-l-2 border-l-primary",
	secondary: "border-l-2 border-l-edge-strong",
};

export default function Panel({
	title,
	accent = "none",
	className,
	children,
	...props
}: PanelProps) {
	return (
		<article
			className={cx(
				"grid gap-2.5 rounded-card border border-edge bg-surface p-4 shadow-card",
				accents[accent],
				className,
			)}
			{...props}
		>
			{title ? <h2 className="text-[1.05rem]">{title}</h2> : null}
			{children}
		</article>
	);
}
