import { cx } from "../lib/classes";
import styles from "./Feedback.module.css";

type StatusMessageProps = {
	children: string;
	tone?: "info" | "danger";
	role?: "status" | "alert";
};

export default function StatusMessage({
	children,
	tone = "info",
	role = "status",
}: StatusMessageProps) {
	return (
		<p className={cx(styles.status, tone === "danger" && styles.danger)} role={role}>
			{children}
		</p>
	);
}
