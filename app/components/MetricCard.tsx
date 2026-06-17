import { cx } from "../lib/classes";
import styles from "./MetricCard.module.css";

type MetricCardProps = {
	label: string;
	value: string | number;
};

export function MetricCard({ label, value }: MetricCardProps) {
	return (
		<article className={styles.card}>
			<span className={styles.label}>{label}</span>
			<strong className={styles.value}>{value}</strong>
		</article>
	);
}

export function MetricSkeleton() {
	return (
		<article className={cx(styles.card, styles.skeleton)} aria-hidden="true">
			<span className={styles.label}>&nbsp;</span>
			<strong className={styles.value}>&nbsp;</strong>
		</article>
	);
}
