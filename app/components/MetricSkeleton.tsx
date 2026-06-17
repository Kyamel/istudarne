import { cx } from "../lib/classes";
import styles from "./MetricCard.module.css";

export default function MetricSkeleton() {
	return (
		<article className={cx(styles.card, styles.skeleton)} aria-hidden="true">
			<span className={styles.label}>&nbsp;</span>
			<strong className={styles.value}>&nbsp;</strong>
		</article>
	);
}
