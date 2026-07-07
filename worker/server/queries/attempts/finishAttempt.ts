import { eq, sql } from "drizzle-orm";
import type { Database } from "../../db/client";
import { pointsEvents, questionAnswers, quizAttempts, quizzes } from "../../db/schema";

export async function finishAttempt(
	db: Database,
	attemptId: string,
	userId: string,
	quizId: string,
) {
	const [totals] = await db
		.select({
			total: sql<number>`count(*)`,
			correct: sql<number>`sum(case when ${questionAnswers.isCorrect} then 1 else 0 end)`,
		})
		.from(questionAnswers)
		.where(eq(questionAnswers.attemptId, attemptId));

	const total = Number(totals?.total ?? 0);
	const correct = Number(totals?.correct ?? 0);
	const wrong = total - correct;
	const points = correct * 10 + total * 2 + 20;
	const now = new Date();

	await db
		.update(quizAttempts)
		.set({
			status: "finished",
			finishedAt: now,
			score: points,
			correctCount: correct,
			wrongCount: wrong,
		})
		.where(eq(quizAttempts.id, attemptId));

	await db.insert(pointsEvents).values({
		id: crypto.randomUUID(),
		userId,
		type: "attempt_finished",
		points,
		metadataJson: JSON.stringify({ attemptId, quizId, correct, total }),
	});

	await db
		.update(quizzes)
		.set({ playsCount: sql`${quizzes.playsCount} + 1` })
		.where(eq(quizzes.id, quizId));

	return { total, correct, wrong, points };
}
