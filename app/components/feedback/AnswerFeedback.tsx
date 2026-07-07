import { cx } from "../../lib/classes";

/* Feedback block shown under a question after the answer is corrected. */
type AnswerFeedbackProps = {
	correct: boolean;
	title: string;
	explanation?: string;
};

export default function AnswerFeedback({ correct, title, explanation }: AnswerFeedbackProps) {
	return (
		<div
			className={cx(
				"rounded-field border px-4 py-3.5",
				correct ? "border-success bg-success-soft" : "border-danger bg-danger-soft",
			)}
			role="status"
		>
			<strong>{title}</strong>
			{explanation ? <p className="mt-2 text-fg">{explanation}</p> : null}
		</div>
	);
}
