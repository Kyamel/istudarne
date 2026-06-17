import type { HTMLAttributes } from "react";
import { cx } from "../lib/classes";
import styles from "./LayoutPrimitives.module.css";

export default function Panel({ className, ...props }: HTMLAttributes<HTMLElement>) {
	return <article className={cx(styles.panel, className)} {...props} />;
}
