type ThemeToggleProps = {
	label: string;
	valueLabel: string;
	dark: boolean;
	onToggle: () => void;
};

export default function ThemeToggle({ label, valueLabel, dark, onToggle }: ThemeToggleProps) {
	return (
		<button
			aria-pressed={dark}
			className="flex min-h-11 cursor-pointer items-center justify-between rounded-field border border-edge bg-surface px-3.5 font-bold text-fg"
			onClick={onToggle}
			type="button"
		>
			{label} <span className="text-[0.86rem] font-semibold text-fg-soft">{valueLabel}</span>
		</button>
	);
}
