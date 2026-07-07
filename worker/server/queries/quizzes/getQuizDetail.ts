import { eq, inArray } from "drizzle-orm";
import type { Database } from "../../db/client";
import { questionOptions, questions, quizzes, users } from "../../db/schema";
import type { QuizDetail } from "../../domain/types";
import { attachTags, summaryColumns } from "../shared";

export async function getQuizDetail(db: Database, quizId: string): Promise<QuizDetail | null> {
	const [quiz] = await db
		.select({ ...summaryColumns, ownerId: quizzes.ownerId })
		.from(quizzes)
		.innerJoin(users, eq(users.id, quizzes.ownerId))
		.where(eq(quizzes.id, quizId))
		.limit(1);
	if (!quiz) return null;

	const questionRows = await db
		.select()
		.from(questions)
		.where(eq(questions.quizId, quizId))
		.orderBy(questions.position);

	const optionRows = questionRows.length
		? await db
				.select()
				.from(questionOptions)
				.where(
					inArray(
						questionOptions.questionId,
						questionRows.map((row) => row.id),
					),
				)
				.orderBy(questionOptions.position)
		: [];

	const optionsByQuestion = new Map<string, { id: string; key: string; text: string }[]>();
	for (const option of optionRows) {
		const list = optionsByQuestion.get(option.questionId) ?? [];
		list.push({ id: option.id, key: option.optionKey, text: option.text });
		optionsByQuestion.set(option.questionId, list);
	}

	const [withTags] = await attachTags(db, [quiz]);

	return {
		...withTags,
		ownerId: quiz.ownerId,
		questions: questionRows.map((question) => ({
			id: question.id,
			topic: question.topic,
			statement: question.statement,
			answer: question.answer,
			explanation: question.explanation,
			options: optionsByQuestion.get(question.id) ?? [],
		})),
	};
}
