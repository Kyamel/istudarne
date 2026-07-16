import type { ReactNode } from "react";

export function ResultMetric({ value, label }: { value: ReactNode; label: string }) {
	return (
		<div>
			<strong className="block text-[1.6rem] tracking-tight">{value}</strong>
			<span className="text-[0.8rem] text-fg-muted">{label}</span>
		</div>
	);
}

export default function ResultMetrics({ children }: { children: ReactNode }) {
	return <div className="my-3 flex flex-wrap justify-center gap-5">{children}</div>;
}
