import type { InputHTMLAttributes } from "react";
import styles from "./Field.module.css";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
	label: string;
};

export function Field({ label, ...inputProps }: FieldProps) {
	return (
		<label className={styles.field}>
			<span className={styles.label}>{label}</span>
			<input className={styles.input} {...inputProps} />
		</label>
	);
}
