import type { ReactNode } from "react";

export function ResultMetric({ value, label }: { value: ReactNode; label: string }) {
	return (
		<div>
			<strong className="block text-[2rem]">{value}</strong>
			<span className="text-[0.85rem] text-fg-muted">{label}</span>
		</div>
	);
}

export default function ResultMetrics({ children }: { children: ReactNode }) {
	return <div className="my-6 flex flex-wrap justify-center gap-6">{children}</div>;
}
