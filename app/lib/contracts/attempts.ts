import { z } from "zod";
import { attemptModeSchema } from "./base";

export const startAttemptRequestSchema = z.object({
	mode: attemptModeSchema.default("practice"),
});

export const startAttemptResponseSchema = z.object({
	attemptId: z.string(),
});

export const submitAnswerRequestSchema = z.object({
	questionId: z.string().min(1),
	selectedOption: z.string().min(1),
	timeSpentMs: z.number().int().nonnegative().optional(),
});

export const submitAnswerResponseSchema = z.object({
	isCorrect: z.boolean(),
	answer: z.string(),
});

export const finishAttemptSummarySchema = z.object({
	total: z.number().int().nonnegative(),
	correct: z.number().int().nonnegative(),
	wrong: z.number().int().nonnegative(),
	points: z.number().int().nonnegative(),
});

export const finishAttemptResponseSchema = z.object({
	summary: finishAttemptSummarySchema,
});

export type StartAttemptRequest = z.input<typeof startAttemptRequestSchema>;
export type SubmitAnswerRequest = z.infer<typeof submitAnswerRequestSchema>;
export type FinishAttemptSummary = z.infer<typeof finishAttemptSummarySchema>;
