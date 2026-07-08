import type { Database } from "../db/client";
import {
	type CreateAiJobInput,
	getAiJob,
	insertAiJob,
	markAiJobFailed,
	markAiJobProcessing,
	markAiJobSucceeded,
} from "../queries/ai/aiJobs";

export function createAiJobRepository(db: Database) {
	return {
		create: (input: CreateAiJobInput) => insertAiJob(db, input),
		get: (id: string) => getAiJob(db, id),
		markProcessing: (id: string) => markAiJobProcessing(db, id),
		markSucceeded: (id: string, resultKey: string) => markAiJobSucceeded(db, id, resultKey),
		markFailed: (id: string, error: string) => markAiJobFailed(db, id, error),
	};
}

export type AiJobRepository = ReturnType<typeof createAiJobRepository>;
