import { desc, eq } from "drizzle-orm";
import type { Database } from "../../db/client";
import { quizAttempts, quizzes } from "../../db/schema";
import type { HistoryEntry } from "../../domain/types";

export async function getUserHistory(db: Database, userId: string): Promise<HistoryEntry[]> {
	const rows = await db
		.select({
			attemptId: quizAttempts.id,
			quizId: quizAttempts.quizId,
			quizTitle: quizzes.title,
			mode: quizAttempts.mode,
			status: quizAttempts.status,
			score: quizAttempts.score,
			correctCount: quizAttempts.correctCount,
			wrongCount: quizAttempts.wrongCount,
			startedAt: quizAttempts.startedAt,
			finishedAt: quizAttempts.finishedAt,
		})
		.from(quizAttempts)
		.innerJoin(quizzes, eq(quizzes.id, quizAttempts.quizId))
		.where(eq(quizAttempts.userId, userId))
		.orderBy(desc(quizAttempts.startedAt))
		.limit(20);

	return rows.map((row) => ({
		...row,
		startedAt: row.startedAt.getTime(),
		finishedAt: row.finishedAt ? row.finishedAt.getTime() : null,
	}));
}
