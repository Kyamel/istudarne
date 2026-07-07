import type { ReactNode } from "react";

/* Prominent floating card used inside a CenteredScreen. */
type CenteredCardProps = {
	children: ReactNode;
	labelledBy?: string;
};

export default function CenteredCard({ children, labelledBy }: CenteredCardProps) {
	return (
		<section
			aria-labelledby={labelledBy}
			className="grid w-[min(100%,420px)] gap-[18px] rounded-panel border border-edge bg-surface p-8 shadow-modal"
		>
			{children}
		</section>
	);
}
