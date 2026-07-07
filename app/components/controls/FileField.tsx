import type { InputHTMLAttributes } from "react";

type FileFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
	label: string;
};

export default function FileField({ label, ...inputProps }: FileFieldProps) {
	return (
		<label className="grid gap-2">
			<span className="text-[0.92rem] font-bold text-fg-muted">{label}</span>
			<input
				className="w-full rounded-field border border-dashed border-edge-strong bg-surface-raised p-3.5 text-fg"
				type="file"
				{...inputProps}
			/>
		</label>
	);
}
