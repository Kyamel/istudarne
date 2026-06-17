import styles from "./Feedback.module.css";

export default function Loading({ children }: { children: string }) {
	return (
		<p className={styles.muted} role="status">
			{children}
		</p>
	);
}
