import type { ReactNode } from "react";
import { cx } from "../lib/classes";
import styles from "./PageHeader.module.css";

type PageHeaderProps = {
	eyebrow: string;
	title: string;
	description?: string;
	actions?: ReactNode;
	column?: boolean;
};

export function PageHeader({ eyebrow, title, description, actions, column }: PageHeaderProps) {
	return (
		<header className={cx(styles.header, column && styles.column)}>
			<div className={styles.content}>
				<p className={styles.eyebrow}>{eyebrow}</p>
				<h1 className={styles.title}>{title}</h1>
				{description ? <p className={styles.description}>{description}</p> : null}
			</div>
			{actions}
		</header>
	);
}
