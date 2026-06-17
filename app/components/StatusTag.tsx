import type { ReactNode } from "react";
import { cx } from "../lib/classes";
import styles from "./LayoutPrimitives.module.css";

type StatusTagProps = {
	children: ReactNode;
	tone: "ok" | "pending";
};

export default function StatusTag({ children, tone }: StatusTagProps) {
	return <span className={cx(styles.status, styles[tone])}>{children}</span>;
}
