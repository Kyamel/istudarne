import type { ReactNode } from "react";
import styles from "./LayoutPrimitives.module.css";

export default function ContentGrid({ children }: { children: ReactNode }) {
	return <section className={styles.grid2}>{children}</section>;
}
