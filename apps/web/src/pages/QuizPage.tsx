import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import {
	AnswerFeedback,
	Button,
	ButtonLink,
	CenterActions,
	Loading,
	Page,
	PageHeader,
	Panel,
	Pill,
	ProgressBar,
	QuizOption,
	ResultCard,
	ResultMetric,
	ResultMetrics,
	Row,
	SplitActions,
	Stack,
	StatusMessage,
} from "../components";
import type { QuizDetail } from "../lib/api";
import { fetchQuiz, finishAttempt, startAttempt, submitAnswer } from "../lib/api";
import { m } from "../lib/i18n";

type AnswerState = { selected: string; isCorrect: boolean; correctAnswer: string };
type Summary = { total: number; correct: number; wrong: number; points: number };

export default function QuizPage() {
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
				<ResultCard
					eyebrow={m.quiz_result_eyebrow()}
					title={m.quiz_result_title({ correct: summary.correct, total: summary.total })}
				>
					<ResultMetrics>
						<ResultMetric
							value={`${Math.round((summary.correct / Math.max(summary.total, 1)) * 100)}%`}
							label={m.quiz_result_accuracy()}
						/>
						<ResultMetric value={`+${summary.points}`} label={m.quiz_result_points()} />
						<ResultMetric value={summary.wrong} label={m.quiz_result_review()} />
					</ResultMetrics>
					<CenterActions>
						<ButtonLink to="/quizzes" variant="primary">
							{m.dashboard_view_library()}
						</ButtonLink>
						<ButtonLink to="/">{m.quiz_go_dashboard()}</ButtonLink>
					</CenterActions>
				</ResultCard>
			</Page>
		);
	}

	const isLast = index === quiz.questions.length - 1;
	const allAnswered = Object.keys(answers).length === quiz.questions.length;

	return (
		<Page narrow compact>
			<PageHeader eyebrow={quiz.title} title={m.quiz_session()} column />

			<ProgressBar value={progress} />

			<Panel>
				<Row justify="between" gap="sm">
					<span className="text-fg-soft">
						{m.quiz_progress({ current: index + 1, total: quiz.questions.length })}
					</span>
					{question.topic ? <Pill>{question.topic}</Pill> : null}
				</Row>
				<h2 className="text-[clamp(1.2rem,3.5vw,1.5rem)] leading-[1.35]">{question.statement}</h2>

				<Stack gap="sm">
					{question.options.map((option) => {
						const isSelected = answered?.selected === option.key;
						return (
							<QuizOption
								key={option.id}
								optionKey={option.key}
								text={option.text}
								selected={isSelected}
								correct={Boolean(answered && option.key === answered.correctAnswer)}
								wrong={Boolean(answered && isSelected && !answered.isCorrect)}
								disabled={Boolean(answered) || pending !== null}
								onSelect={() => handleSelect(option.key)}
							/>
						);
					})}
				</Stack>

				{answered ? (
					<AnswerFeedback
						correct={answered.isCorrect}
						title={answered.isCorrect ? m.quiz_correct() : m.quiz_almost()}
						explanation={question.explanation ?? undefined}
					/>
				) : null}

				<SplitActions>
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
				</SplitActions>
			</Panel>
		</Page>
	);
}
