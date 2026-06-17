import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "../lib/classes";
import styles from "./LayoutPrimitives.module.css";

export function Page({ children, narrow }: { children: ReactNode; narrow?: boolean }) {
	return <section className={cx(styles.stack, narrow && styles.narrow)}>{children}</section>;
}

export function Panel({ className, ...props }: HTMLAttributes<HTMLElement>) {
	return <article className={cx(styles.panel, className)} {...props} />;
}

export function MetricsGrid({ children }: { children: ReactNode }) {
	return <div className={styles.metrics}>{children}</div>;
}

export function ContentGrid({ children }: { children: ReactNode }) {
	return <section className={styles.grid2}>{children}</section>;
}

export function Muted({ children }: { children: ReactNode }) {
	return <p className={styles.muted}>{children}</p>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
	return <p className={styles.eyebrow}>{children}</p>;
}

export function SimpleList({ children }: { children: ReactNode }) {
	return <ul className={styles.list}>{children}</ul>;
}

export function CheckList({ children }: { children: ReactNode }) {
	return <ul className={styles.checkList}>{children}</ul>;
}

export function StatusTag({ children, tone }: { children: ReactNode; tone: "ok" | "pending" }) {
	return <span className={cx(styles.status, styles[tone])}>{children}</span>;
}

export function Pill({ children }: { children: ReactNode }) {
	return <span className={styles.pill}>{children}</span>;
}

export function TagRow({ tags }: { tags: string[] }) {
	return (
		<div className={styles.tagRow}>
			{tags.map((tag) => (
				<span className={styles.tag} key={tag}>
					{tag}
				</span>
			))}
		</div>
	);
}

export function CenterActions({ children }: { children: ReactNode }) {
	return <div className={styles.centerActions}>{children}</div>;
}
