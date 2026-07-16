type ProgressBarProps = {
	/* Progress percentage from 0 to 100. */
	value: number;
};

export default function ProgressBar({ value }: ProgressBarProps) {
	return (
		<div
			className="h-2 overflow-hidden rounded-full bg-surface-muted"
			role="progressbar"
			aria-valuenow={value}
			aria-valuemin={0}
			aria-valuemax={100}
		>
			<span
				className="block h-full bg-primary transition-[width] duration-240 ease-out"
				style={{ width: `${value}%` }}
			/>
		</div>
	);
}
