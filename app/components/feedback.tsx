import { cx } from "../lib/classes";
import styles from "./feedback.module.css";

type StatusMessageProps = {
	children: string;
	tone?: "info" | "danger";
	role?: "status" | "alert";
};

export function StatusMessage({ children, tone = "info", role = "status" }: StatusMessageProps) {
	return (
		<p className={cx(styles.status, tone === "danger" && styles.danger)} role={role}>
			{children}
		</p>
	);
}

export function Loading({ children }: { children: string }) {
	return (
		<p className={styles.muted} role="status">
			{children}
		</p>
	);
}
