import type { QuizSummary } from "../../lib/api";
import { m } from "../../lib/i18n";
import TagRow from "../feedback/TagRow";
import VisibilityTag from "../feedback/VisibilityTag";
import ButtonLink from "../navigation/ButtonLink";

export default function QuizCard({ quiz }: { quiz: QuizSummary }) {
	return (
		<article className="grid gap-3.5 rounded-card border border-edge bg-surface p-5 shadow-card">
			<div>
				<VisibilityTag visibility={quiz.visibility} />
				<h2 className="mt-2.5 mb-3 text-xl">{quiz.title}</h2>
				<p className="text-fg-muted">{quiz.description || "—"}</p>
			</div>
			{quiz.tags.length ? <TagRow tags={quiz.tags} /> : null}
			<footer className="flex flex-wrap items-center justify-between gap-2.5">
				<small className="text-fg-soft">
					{m.quiz_card_questions({ count: quiz.questionCount })} ·{" "}
					{m.quiz_card_by({ author: quiz.ownerDisplayName })}
				</small>
				<ButtonLink to={`/quizzes/${quiz.id}/play`}>{m.quiz_card_study()}</ButtonLink>
			</footer>
		</article>
	);
}
