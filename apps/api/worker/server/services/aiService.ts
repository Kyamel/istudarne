import type { AiJob, AiJobResult, CreateAiJobRequest } from "@istudarne/contracts";
import { createAiJobRequestSchema } from "@istudarne/contracts";
import { notFound } from "../errors";
import type { AiJobRepository } from "../repositories/aiJobRepository";
import type { StorageRepository } from "../repositories/storageRepository";

export type AiJobMessage = { jobId: string };

export type AiJobInput = { kind: "prompt"; prompt: string };

export const aiJobInputKey = (jobId: string) => `ai/jobs/${jobId}/input.json`;
export const aiJobResultKey = (jobId: string) => `ai/jobs/${jobId}/result.json`;

type AiJobRow = NonNullable<Awaited<ReturnType<AiJobRepository["get"]>>>;

function toAiJob(row: AiJobRow, result: AiJobResult | null): AiJob {
	return {
		id: row.id,
		kind: row.kind as AiJob["kind"],
		status: row.status,
		error: row.error,
		result,
		createdAt: row.createdAt.getTime(),
		updatedAt: row.updatedAt.getTime(),
	};
}

export function createAiService(
	jobs: AiJobRepository,
	storage: StorageRepository,
	queue: Queue<AiJobMessage>,
) {
	return {
		/**
		 * Fast path: persist the payload and enqueue. The OpenAI call happens in
		 * the queue consumer so the user's request returns immediately instead
		 * of waiting several seconds for the model.
		 */
		async createJob(userId: string, request: CreateAiJobRequest): Promise<AiJob> {
			const input = createAiJobRequestSchema.parse(request);
			const id = crypto.randomUUID();
			const inputKey = aiJobInputKey(id);

			await storage.putJson(inputKey, { kind: input.kind, prompt: input.prompt });
			await jobs.create({ id, userId, kind: input.kind, inputKey });
			await queue.send({ jobId: id });

			const row = await jobs.get(id);
			if (!row) throw notFound("AI job not found.");
			return toAiJob(row, null);
		},

		async getJob(id: string, userId: string): Promise<AiJob> {
			const row = await jobs.get(id);
			if (!row || row.userId !== userId) throw notFound("AI job not found.");

			const result =
				row.status === "succeeded" && row.resultKey
					? await storage.getJson<AiJobResult>(row.resultKey)
					: null;
			return toAiJob(row, result);
		},
	};
}

export type AiService = ReturnType<typeof createAiService>;
