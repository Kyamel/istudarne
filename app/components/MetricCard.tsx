import styles from "./MetricCard.module.css";

type MetricCardProps = {
	label: string;
	value: string | number;
};

export default function MetricCard({ label, value }: MetricCardProps) {
	return (
		<article className={styles.card}>
			<span className={styles.label}>{label}</span>
			<strong className={styles.value}>{value}</strong>
		</article>
	);
}
