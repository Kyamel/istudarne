type MetricCardProps = {
	label: string;
	value: string | number;
};

export default function MetricCard({ label, value }: MetricCardProps) {
	return (
		<article className="rounded-card border border-edge bg-surface px-4 py-3.5 shadow-card">
			<span className="text-[0.8rem] font-medium text-fg-muted">{label}</span>
			<strong className="mt-1 block text-[1.5rem] leading-tight tracking-tight">{value}</strong>
		</article>
	);
}
