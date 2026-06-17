import type { ReactNode } from "react";
import styles from "./LayoutPrimitives.module.css";

export default function Pill({ children }: { children: ReactNode }) {
	return <span className={styles.pill}>{children}</span>;
}
