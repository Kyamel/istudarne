import { z } from "zod";

export const userStatsSchema = z.object({
	questionsToday: z.number().int().nonnegative(),
	questionsTotal: z.number().int().nonnegative(),
	accuracy: z.number().nonnegative(),
	streak: z.number().int().nonnegative(),
	points: z.number().int().nonnegative(),
	quizzesOwned: z.number().int().nonnegative(),
	attempts: z.number().int().nonnegative(),
});

export const historyEntrySchema = z.object({
	attemptId: z.string(),
	quizId: z.string(),
	quizTitle: z.string(),
	mode: z.string(),
	status: z.string(),
	score: z.number(),
	correctCount: z.number().int().nonnegative(),
	wrongCount: z.number().int().nonnegative(),
	startedAt: z.number(),
	finishedAt: z.number().nullable(),
});

export const statsResponseSchema = z.object({
	stats: userStatsSchema,
});

export const historyResponseSchema = z.object({
	history: z.array(historyEntrySchema),
});

export type UserStats = z.infer<typeof userStatsSchema>;
export type HistoryEntry = z.infer<typeof historyEntrySchema>;
