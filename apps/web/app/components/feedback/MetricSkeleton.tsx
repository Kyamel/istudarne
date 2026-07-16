export default function MetricSkeleton() {
	return (
		<article
			className="rounded-card border border-edge bg-surface p-5 shadow-card"
			aria-hidden="true"
		>
			<span className="block animate-pulse rounded-md bg-surface-muted text-[0.9rem] text-transparent">
				&nbsp;
			</span>
			<strong className="mt-1.5 block animate-pulse rounded-md bg-surface-muted text-[clamp(1.6rem,5vw,2rem)] text-transparent">
				&nbsp;
			</strong>
		</article>
	);
}
