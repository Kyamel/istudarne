import type { ReactNode } from "react";
import styles from "./LayoutPrimitives.module.css";

export default function Muted({ children }: { children: ReactNode }) {
	return <p className={styles.muted}>{children}</p>;
}
