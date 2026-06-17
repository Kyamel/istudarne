import type { ReactNode } from "react";
import styles from "./LayoutPrimitives.module.css";

export default function CenterActions({ children }: { children: ReactNode }) {
	return <div className={styles.centerActions}>{children}</div>;
}
