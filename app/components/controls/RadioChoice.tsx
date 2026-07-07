import type { InputHTMLAttributes } from "react";

type RadioChoiceProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
	label: string;
};

export default function RadioChoice({ label, ...inputProps }: RadioChoiceProps) {
	return (
		<label className="flex min-h-11 items-center gap-2.5 text-fg">
			<input className="h-5 w-5 accent-primary" type="radio" {...inputProps} />
			{label}
		</label>
	);
}
