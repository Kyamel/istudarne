import { cx } from "../lib/classes";
import styles from "./Avatar.module.css";

type AvatarProps = {
	name: string;
	size?: "sm" | "lg";
};

export default function Avatar({ name, size = "lg" }: AvatarProps) {
	const initial = (name || "?").slice(0, 1).toUpperCase();
	return (
		<span className={cx(styles.avatar, styles[size])} aria-hidden="true">
			{initial}
		</span>
	);
}
