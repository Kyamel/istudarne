import { z } from "zod";
import { visibilitySchema } from "./base";

export const quizOptionSchema = z.object({
	id: z.string(),
	key: z.string(),
	text: z.string(),
});

export const quizQuestionSchema = z.object({
	id: z.string(),
	topic: z.string().nullable(),
	statement: z.string(),
	answer: z.string(),
	explanation: z.string().nullable(),
	options: z.array(quizOptionSchema),
});

export const quizSummarySchema = z.object({
	id: z.string(),
	title: z.string(),
	description: z.string().nullable(),
	visibility: visibilitySchema,
	questionCount: z.number().int().nonnegative(),
	playsCount: z.number().int().nonnegative(),
	ownerUsername: z.string(),
	ownerDisplayName: z.string(),
	tags: z.array(z.string()),
});

export const quizDetailSchema = quizSummarySchema.extend({
	ownerId: z.string(),
	questions: z.array(quizQuestionSchema),
});

export const patchQuizRequestSchema = z.object({
	title: z.string().min(1).max(160).optional(),
	description: z.string().max(1200).nullable().optional(),
	visibility: visibilitySchema.optional(),
	tags: z.array(z.string().min(1).max(48)).max(12).optional(),
});

export const quizListResponseSchema = z.object({
	quizzes: z.array(quizSummarySchema),
});

export const quizSummaryResponseSchema = z.object({
	quiz: quizSummarySchema,
});

export const quizDetailResponseSchema = z.object({
	quiz: quizDetailSchema,
});

export type QuizSummary = z.infer<typeof quizSummarySchema>;
export type QuizQuestion = z.infer<typeof quizQuestionSchema>;
export type QuizDetail = z.infer<typeof quizDetailSchema>;
export type PatchQuizRequest = z.infer<typeof patchQuizRequestSchema>;
