import { cx } from "../../lib/classes";

type TabOption<T extends string> = {
	value: T;
	label: string;
};

type TabsProps<T extends string> = {
	label: string;
	value: T;
	options: TabOption<T>[];
	onChange: (value: T) => void;
	grow?: boolean;
};

export default function Tabs<T extends string>({
	label,
	value,
	options,
	onChange,
	grow,
}: TabsProps<T>) {
	return (
		<div
			className={cx(
				"gap-1 rounded-full border border-edge bg-surface-muted p-1",
				grow ? "flex w-full" : "inline-flex w-fit",
			)}
			role="tablist"
			aria-label={label}
		>
			{options.map((option) => (
				<button
					key={option.value}
					aria-selected={value === option.value}
					className={cx(
						"min-h-10 cursor-pointer rounded-full border-0 bg-transparent px-4.5 py-2.25 font-bold text-fg-muted aria-selected:bg-surface-raised aria-selected:text-fg aria-selected:shadow-pop",
						grow && "flex-1",
					)}
					onClick={() => onChange(option.value)}
					role="tab"
					type="button"
				>
					{option.label}
				</button>
			))}
		</div>
	);
}
