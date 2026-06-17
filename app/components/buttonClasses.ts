import { cx } from "../lib/classes";
import styles from "./Button.module.css";

export type ButtonVariant = "default" | "primary" | "ghost";

export default function buttonClasses(variant: ButtonVariant, extra?: string) {
	return cx(styles.button, variant === "default" ? "" : styles[variant], extra);
}
