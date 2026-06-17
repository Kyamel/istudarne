import type { ReactNode } from "react";
import { cx } from "../lib/classes";
import styles from "./LayoutPrimitives.module.css";

type PageProps = {
	children: ReactNode;
	compact?: boolean;
	narrow?: boolean;
};

export default function Page({ children, compact, narrow }: PageProps) {
	return (
		<section className={cx(styles.stack, compact && styles.compact, narrow && styles.narrow)}>
			{children}
		</section>
	);
}
