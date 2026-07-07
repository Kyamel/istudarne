import type { ReactNode } from "react";
import { cx } from "../../lib/classes";

type PageProps = {
	children: ReactNode;
	compact?: boolean;
	narrow?: boolean;
};

export default function Page({ children, compact, narrow }: PageProps) {
	return (
		<section
			className={cx(
				"mx-auto grid w-full",
				compact ? "gap-3" : "gap-6",
				narrow ? "max-w-[760px]" : "max-w-[1120px]",
			)}
		>
			{children}
		</section>
	);
}
