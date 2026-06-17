import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
	Button,
	ButtonLink,
	CenterActions,
	Eyebrow,
	Loading,
	Page,
	PageHeader,
	Pill,
	StatusMessage,
} from "../components";
import type { QuizDetail } from "../lib/api";
import { fetchQuiz, finishAttempt, startAttempt, submitAnswer } from "../lib/api";
import { cx } from "../lib/classes";
import { m } from "../lib/i18n";
import styles from "./Quiz.module.css";

type AnswerState = { selected: string; isCorrect: boolean; correctAnswer: string };
type Summary = { total: number; correct: number; wrong: number; points: number };

export function QuizPage() {
	const { quizId } = useParams();
	const [quiz, setQuiz] = useState<QuizDetail | null>(null);
	const [attemptId, setAttemptId] = useState<string | null>(null);
	const [index, setIndex] = useState(0);
	const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
	const [pending, setPending] = useState<string | null>(null);
	const [summary, setSummary] = useState<Summary | null>(null);
	const [error, setError] = useState("");
	const questionStart = useRef(Date.now());

	useEffect(() => {
		if (!quizId) return;
		let active = true;
		setError("");
		fetchQuiz(quizId)
			.then(async (data) => {
				if (!active) return;
				setQuiz(data.quiz);
				const attempt = await startAttempt(quizId);
				if (active) setAttemptId(attempt.attemptId);
			})
			.catch((err: Error) => active && setError(err.message));
		return () => {
			active = false;
		};
	}, [quizId]);

	const question = quiz?.questions[index];
	const answered = question ? answers[question.id] : undefined;
	const progress = useMemo(() => {
		if (!quiz?.questions.length) return 0;
		return Math.round((Object.keys(answers).length / quiz.questions.length) * 100);
	}, [answers, quiz]);

	async function handleSelect(optionKey: string) {
		if (!attemptId || !question || answered || pending) return;
		setPending(optionKey);
		try {
			const result = await submitAnswer(attemptId, {
				questionId: question.id,
				selectedOption: optionKey,
				timeSpentMs: Date.now() - questionStart.current,
			});
			setAnswers((current) => ({
				...current,
				[question.id]: {
					selected: optionKey,
					isCorrect: result.isCorrect,
					correctAnswer: result.answer,
				},
			}));
		} catch (err) {
			setError(err instanceof Error ? err.message : m.auth_generic_error());
		} finally {
			setPending(null);
		}
	}

	async function handleFinish() {
		if (!attemptId) return;
		try {
			const result = await finishAttempt(attemptId);
			setSummary(result.summary);
		} catch (err) {
			setError(err instanceof Error ? err.message : m.auth_generic_error());
		}
	}

	if (error) {
		return (
			<Page narrow>
				<StatusMessage tone="danger" role="alert">
					{error}
				</StatusMessage>
				<ButtonLink to="/quizzes">{m.dashboard_view_library()}</ButtonLink>
			</Page>
		);
	}

	if (!quiz || !question) {
		return (
			<Page narrow>
				<Loading>{m.quiz_loading()}</Loading>
			</Page>
		);
	}

	if (summary) {
		return (
			<Page narrow>
				<article className={styles.result}>
					<Eyebrow>{m.quiz_result_eyebrow()}</Eyebrow>
					<h1>{m.quiz_result_title({ correct: summary.correct, total: summary.total })}</h1>
					<div className={styles.resultMetrics}>
						<div>
							<strong>{Math.round((summary.correct / Math.max(summary.total, 1)) * 100)}%</strong>
							<span>{m.quiz_result_accuracy()}</span>
						</div>
						<div>
							<strong>+{summary.points}</strong>
							<span>{m.quiz_result_points()}</span>
						</div>
						<div>
							<strong>{summary.wrong}</strong>
							<span>{m.quiz_result_review()}</span>
						</div>
					</div>
					<CenterActions>
						<ButtonLink to="/quizzes" variant="primary">
							{m.dashboard_view_library()}
						</ButtonLink>
						<ButtonLink to="/">{m.quiz_go_dashboard()}</ButtonLink>
					</CenterActions>
				</article>
			</Page>
		);
	}

	const isLast = index === quiz.questions.length - 1;
	const allAnswered = Object.keys(answers).length === quiz.questions.length;

	return (
		<Page narrow>
			<PageHeader eyebrow={quiz.title} title={m.quiz_session()} column />

			<div
				className={styles.progress}
				role="progressbar"
				aria-valuenow={progress}
				aria-valuemin={0}
				aria-valuemax={100}
			>
				<span style={{ width: `${progress}%` }} />
			</div>

			<article className={styles.panel}>
				<div className={styles.questionHead}>
					<span>{m.quiz_progress({ current: index + 1, total: quiz.questions.length })}</span>
					{question.topic ? <Pill>{question.topic}</Pill> : null}
				</div>
				<h2>{question.statement}</h2>

				<div className={styles.options}>
					{question.options.map((option) => {
						const isSelected = answered?.selected === option.key;
						const isCorrect = answered && option.key === answered.correctAnswer;
						const isWrong = answered && isSelected && !answered.isCorrect;
						return (
							<button
								aria-pressed={isSelected}
								className={cx(
									styles.option,
									isSelected && styles.selected,
									isCorrect && styles.correct,
									isWrong && styles.wrong,
								)}
								disabled={Boolean(answered) || pending !== null}
								key={option.id}
								onClick={() => handleSelect(option.key)}
								type="button"
							>
								<span className={styles.optionKey} aria-hidden="true">
									{option.key}
								</span>
								<span className={styles.optionText}>{option.text}</span>
							</button>
						);
					})}
				</div>

				{answered ? (
					<div
						className={cx(
							styles.feedback,
							answered.isCorrect ? styles.feedbackOk : styles.feedbackBad,
						)}
						role="status"
					>
						<strong>{answered.isCorrect ? m.quiz_correct() : m.quiz_almost()}</strong>
						{question.explanation ? <p>{question.explanation}</p> : null}
					</div>
				) : null}

				<div className={styles.nav}>
					<Button
						disabled={index === 0}
						onClick={() => {
							questionStart.current = Date.now();
							setIndex((value) => Math.max(0, value - 1));
						}}
					>
						{m.quiz_prev()}
					</Button>
					{isLast ? (
						<Button variant="primary" disabled={!allAnswered} onClick={handleFinish}>
							{m.quiz_finish()}
						</Button>
					) : (
						<Button
							variant="primary"
							onClick={() => {
								questionStart.current = Date.now();
								setIndex((value) => Math.min(quiz.questions.length - 1, value + 1));
							}}
						>
							{m.quiz_next()}
						</Button>
					)}
				</div>
			</article>
		</Page>
	);
}
