import type { ReactNode } from "react";
import { cx } from "../../lib/classes";

type PageHeaderProps = {
	eyebrow: string;
	title: string;
	description?: string;
	actions?: ReactNode;
	leading?: ReactNode;
	children?: ReactNode;
	column?: boolean;
};

export default function PageHeader({
	eyebrow,
	title,
	description,
	actions,
	leading,
	children,
	column,
}: PageHeaderProps) {
	return (
		<header
			className={cx("flex flex-wrap items-start justify-between gap-3", column && "flex-col")}
		>
			{leading}
			<div className={column ? "" : "min-w-[min(100%,22rem)] flex-[1_1_22rem]"}>
				<p className="text-[0.72rem] font-extrabold tracking-[0.08em] text-secondary uppercase">
					{eyebrow}
				</p>
				<h1 className="mt-0.5 mb-1.5 text-[clamp(1.35rem,3.5vw,1.9rem)] leading-[1.15] tracking-tight">
					{title}
				</h1>
				{description ? (
					<p className="max-w-[60ch] text-[0.95rem] text-fg-muted">{description}</p>
				) : null}
				{children}
			</div>
			{actions}
		</header>
	);
}
