import type { InputHTMLAttributes } from "react";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
	label: string;
};

export default function Field({ label, ...inputProps }: FieldProps) {
	return (
		<label className="grid gap-2">
			<span className="text-[0.92rem] font-semibold text-fg-muted">{label}</span>
			<input
				className="min-h-12 w-full rounded-field border border-edge bg-surface-raised px-3.5 py-3 text-fg placeholder:text-fg-soft"
				{...inputProps}
			/>
		</label>
	);
}
