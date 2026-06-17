import styles from "./LayoutPrimitives.module.css";

export default function TagRow({ tags }: { tags: string[] }) {
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
