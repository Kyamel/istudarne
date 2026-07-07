type MetricCardProps = {
	label: string;
	value: string | number;
};

export default function MetricCard({ label, value }: MetricCardProps) {
	return (
		<article className="rounded-card border border-edge bg-surface p-5 shadow-card">
			<span className="text-[0.9rem] text-fg-muted">{label}</span>
			<strong className="mt-1.5 block text-[clamp(1.6rem,5vw,2rem)]">{value}</strong>
		</article>
	);
}
