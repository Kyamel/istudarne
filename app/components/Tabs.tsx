import styles from "./Tabs.module.css";

type TabOption<T extends string> = {
	value: T;
	label: string;
};

type TabsProps<T extends string> = {
	label: string;
	value: T;
	options: TabOption<T>[];
	onChange: (value: T) => void;
};

export default function Tabs<T extends string>({ label, value, options, onChange }: TabsProps<T>) {
	return (
		<div className={styles.tabs} role="tablist" aria-label={label}>
			{options.map((option) => (
				<button
					key={option.value}
					aria-selected={value === option.value}
					className={styles.tab}
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
