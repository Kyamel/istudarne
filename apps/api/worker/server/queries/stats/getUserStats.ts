import { and, desc, eq, gte, sql } from "drizzle-orm";
import type { Database } from "../../db/client";
import { pointsEvents, questionAnswers, quizAttempts, quizzes } from "../../db/schema";
import type { UserStats } from "../../domain/types";

function computeStreak(days: string[]) {
	if (days.length === 0) return 0;
	const set = new Set(days);
	const cursor = new Date();
	cursor.setHours(0, 0, 0, 0);
	const iso = (date: Date) => date.toISOString().slice(0, 10);

	if (!set.has(iso(cursor))) {
		cursor.setDate(cursor.getDate() - 1);
		if (!set.has(iso(cursor))) return 0;
	}

	let streak = 0;
	while (set.has(iso(cursor))) {
		streak += 1;
		cursor.setDate(cursor.getDate() - 1);
	}
	return streak;
}

export async function getUserStats(db: Database, userId: string): Promise<UserStats> {
	const startOfDay = new Date();
	startOfDay.setHours(0, 0, 0, 0);

	const [today] = await db
		.select({ count: sql<number>`count(*)` })
		.from(questionAnswers)
		.innerJoin(quizAttempts, eq(quizAttempts.id, questionAnswers.attemptId))
		.where(and(eq(quizAttempts.userId, userId), gte(questionAnswers.answeredAt, startOfDay)));

	const [overall] = await db
		.select({
			total: sql<number>`count(*)`,
			correct: sql<number>`sum(case when ${questionAnswers.isCorrect} then 1 else 0 end)`,
		})
		.from(questionAnswers)
		.innerJoin(quizAttempts, eq(quizAttempts.id, questionAnswers.attemptId))
		.where(eq(quizAttempts.userId, userId));

	const [pointsRow] = await db
		.select({ points: sql<number>`coalesce(sum(${pointsEvents.points}), 0)` })
		.from(pointsEvents)
		.where(eq(pointsEvents.userId, userId));

	const [quizzesRow] = await db
		.select({ count: sql<number>`count(*)` })
		.from(quizzes)
		.where(eq(quizzes.ownerId, userId));

	const [attemptsRow] = await db
		.select({ count: sql<number>`count(*)` })
		.from(quizAttempts)
		.where(eq(quizAttempts.userId, userId));

	const dayRows = await db
		.select({
			day: sql<string>`(${questionAnswers.answeredAt})::date`,
		})
		.from(questionAnswers)
		.innerJoin(quizAttempts, eq(quizAttempts.id, questionAnswers.attemptId))
		.where(eq(quizAttempts.userId, userId))
		.groupBy(sql`(${questionAnswers.answeredAt})::date`)
		.orderBy(desc(sql`(${questionAnswers.answeredAt})::date`));

	const total = Number(overall?.total ?? 0);
	const correct = Number(overall?.correct ?? 0);

	return {
		questionsToday: Number(today?.count ?? 0),
		questionsTotal: total,
		accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
		streak: computeStreak(dayRows.map((row) => row.day)),
		points: Number(pointsRow?.points ?? 0),
		quizzesOwned: Number(quizzesRow?.count ?? 0),
		attempts: Number(attemptsRow?.count ?? 0),
	};
}
