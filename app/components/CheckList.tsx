import type { ReactNode } from "react";
import styles from "./LayoutPrimitives.module.css";

export default function CheckList({ children }: { children: ReactNode }) {
	return <ul className={styles.checkList}>{children}</ul>;
}
