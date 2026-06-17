import type { QuizSummary } from "../lib/api";
import { cx } from "../lib/classes";
import { m } from "../lib/i18n";
import ButtonLink from "./ButtonLink";
import styles from "./QuizCard.module.css";

const visibilityLabel: Record<QuizSummary["visibility"], () => string> = {
	public: () => m.visibility_public(),
	private: () => m.visibility_private(),
	unlisted: () => m.visibility_unlisted(),
};

export default function QuizCard({ quiz }: { quiz: QuizSummary }) {
	return (
		<article className={styles.card}>
			<div>
				<span className={cx(styles.pill, styles[quiz.visibility])}>
					{visibilityLabel[quiz.visibility]()}
				</span>
				<h2 className={styles.title}>{quiz.title}</h2>
				<p className={styles.description}>{quiz.description || "—"}</p>
			</div>
			{quiz.tags.length ? (
				<div className={styles.tags}>
					{quiz.tags.map((tag) => (
						<span className={styles.tag} key={tag}>
							{tag}
						</span>
					))}
				</div>
			) : null}
			<footer className={styles.footer}>
				<small>
					{m.quiz_card_questions({ count: quiz.questionCount })} ·{" "}
					{m.quiz_card_by({ author: quiz.ownerDisplayName })}
				</small>
				<ButtonLink to={`/quizzes/${quiz.id}/play`}>{m.quiz_card_study()}</ButtonLink>
			</footer>
		</article>
	);
}
