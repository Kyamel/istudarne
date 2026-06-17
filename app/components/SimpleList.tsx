import type { ReactNode } from "react";
import styles from "./LayoutPrimitives.module.css";

export default function SimpleList({ children }: { children: ReactNode }) {
	return <ul className={styles.list}>{children}</ul>;
}
