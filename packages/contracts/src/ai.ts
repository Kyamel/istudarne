import { z } from "zod";

/**
 * AI jobs are processed asynchronously: the API enqueues the job on a
 * Cloudflare Queue and responds 202 immediately; clients poll the job until
 * it succeeds or fails.
 */
export const aiJobKindSchema = z.enum(["prompt"]);

export const aiJobStatusSchema = z.enum(["queued", "processing", "succeeded", "failed"]);

export const createAiJobRequestSchema = z.object({
	kind: aiJobKindSchema.default("prompt"),
	prompt: z.string().trim().min(1).max(8000),
});

export const aiJobResultSchema = z.object({
	text: z.string(),
});

export const aiJobSchema = z.object({
	id: z.string(),
	kind: aiJobKindSchema,
	status: aiJobStatusSchema,
	error: z.string().nullable(),
	result: aiJobResultSchema.nullable(),
	createdAt: z.number(),
	updatedAt: z.number(),
});

export const aiJobResponseSchema = z.object({
	job: aiJobSchema,
});

export type AiJobKind = z.infer<typeof aiJobKindSchema>;
export type AiJobStatus = z.infer<typeof aiJobStatusSchema>;
export type CreateAiJobRequest = z.input<typeof createAiJobRequestSchema>;
export type AiJob = z.infer<typeof aiJobSchema>;
export type AiJobResult = z.infer<typeof aiJobResultSchema>;
