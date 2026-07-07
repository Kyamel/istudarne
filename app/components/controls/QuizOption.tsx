import { cx } from "../../lib/classes";

/* One selectable answer in the quiz screen. State is derived by the page:
   correct/wrong always come with text feedback so color is never the only cue. */
type QuizOptionProps = {
	optionKey: string;
	text: string;
	selected?: boolean;
	correct?: boolean;
	wrong?: boolean;
	disabled?: boolean;
	onSelect: () => void;
};

export default function QuizOption({
	optionKey,
	text,
	selected,
	correct,
	wrong,
	disabled,
	onSelect,
}: QuizOptionProps) {
	return (
		<button
			aria-pressed={selected}
			className={cx(
				"flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-field border-[1.5px] bg-surface-raised px-4 py-3.5 text-left text-fg transition duration-150",
				"enabled:hover:border-edge-strong enabled:hover:bg-surface-muted disabled:cursor-default",
				correct
					? "border-success bg-success-soft"
					: wrong
						? "border-danger bg-danger-soft"
						: selected
							? "border-primary"
							: "border-edge",
			)}
			disabled={disabled}
			onClick={onSelect}
			type="button"
		>
			<span
				className={cx(
					"inline-flex h-9 min-w-9 shrink-0 items-center justify-center rounded-field bg-surface-muted font-extrabold",
					correct ? "text-success" : wrong ? "text-danger" : "text-fg-muted",
				)}
				aria-hidden="true"
			>
				{optionKey}
			</span>
			<span className="flex-1">{text}</span>
		</button>
	);
}
