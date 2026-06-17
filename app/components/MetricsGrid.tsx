import type { ReactNode } from "react";
import styles from "./LayoutPrimitives.module.css";

export default function MetricsGrid({ children }: { children: ReactNode }) {
	return <div className={styles.metrics}>{children}</div>;
}
