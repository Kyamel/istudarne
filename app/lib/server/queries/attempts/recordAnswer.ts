import { and, eq } from "drizzle-orm";
import type { Database } from "../../db/client";
import { questionAnswers, questions } from "../../db/schema";

export async function recordAnswer(
	db: Database,
	input: {
		attemptId: string;
		questionId: string;
		selectedOption: string;
		timeSpentMs?: number;
	},
) {
	const [question] = await db
		.select({ answer: questions.answer })
		.from(questions)
		.where(eq(questions.id, input.questionId))
		.limit(1);
	if (!question) throw new Error("Questão não encontrada.");

	const isCorrect = question.answer === input.selectedOption;

	const [existing] = await db
		.select({ id: questionAnswers.id })
		.from(questionAnswers)
		.where(
			and(
				eq(questionAnswers.attemptId, input.attemptId),
				eq(questionAnswers.questionId, input.questionId),
			),
		)
		.limit(1);

	if (existing) {
		await db
			.update(questionAnswers)
			.set({
				selectedOption: input.selectedOption,
				isCorrect,
				answeredAt: new Date(),
				timeSpentMs: input.timeSpentMs ?? null,
			})
			.where(eq(questionAnswers.id, existing.id));
	} else {
		await db.insert(questionAnswers).values({
			id: crypto.randomUUID(),
			attemptId: input.attemptId,
			questionId: input.questionId,
			selectedOption: input.selectedOption,
			isCorrect,
			timeSpentMs: input.timeSpentMs ?? null,
		});
	}

	return { isCorrect, answer: question.answer };
}
