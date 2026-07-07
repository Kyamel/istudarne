import type { ReactNode } from "react";

/* Groups a set of RadioChoice options under an accessible legend. */
type ChoiceFieldsetProps = {
	legend: string;
	children: ReactNode;
};

export default function ChoiceFieldset({ legend, children }: ChoiceFieldsetProps) {
	return (
		<fieldset className="m-0 grid gap-2.5 rounded-field border border-edge p-3.5">
			<legend className="text-[0.92rem] font-bold text-fg-muted">{legend}</legend>
			{children}
		</fieldset>
	);
}
