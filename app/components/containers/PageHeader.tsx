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
			className={cx("flex flex-wrap items-start justify-between gap-4", column && "flex-col")}
		>
			{leading}
			<div className={column ? "" : "min-w-[min(100%,22rem)] flex-[1_1_22rem]"}>
				<p className="text-[0.78rem] font-extrabold tracking-[0.03em] text-secondary uppercase">
					{eyebrow}
				</p>
				<h1 className="mt-1 mb-2.5 text-[clamp(1.7rem,5vw,2.8rem)] leading-[1.05]">{title}</h1>
				{description ? <p className="max-w-[60ch] text-fg-muted">{description}</p> : null}
				{children}
			</div>
			{actions}
		</header>
	);
}
