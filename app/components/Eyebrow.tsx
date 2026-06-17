import type { ReactNode } from "react";
import styles from "./LayoutPrimitives.module.css";

export default function Eyebrow({ children }: { children: ReactNode }) {
	return <p className={styles.eyebrow}>{children}</p>;
}
