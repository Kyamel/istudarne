import { eq } from "drizzle-orm";
import type { Database } from "../../db/client";
import { aiJobs } from "../../db/schema";

export type CreateAiJobInput = {
	id: string;
	userId: string;
	kind: string;
	inputKey: string;
};

export async function insertAiJob(db: Database, input: CreateAiJobInput) {
	const now = new Date();
	await db.insert(aiJobs).values({ ...input, status: "queued", createdAt: now, updatedAt: now });
}

export async function getAiJob(db: Database, id: string) {
	const [row] = await db.select().from(aiJobs).where(eq(aiJobs.id, id)).limit(1);
	return row ?? null;
}

export async function markAiJobProcessing(db: Database, id: string) {
	await db
		.update(aiJobs)
		.set({ status: "processing", updatedAt: new Date() })
		.where(eq(aiJobs.id, id));
}

export async function markAiJobSucceeded(db: Database, id: string, resultKey: string) {
	await db
		.update(aiJobs)
		.set({ status: "succeeded", resultKey, error: null, updatedAt: new Date() })
		.where(eq(aiJobs.id, id));
}

export async function markAiJobFailed(db: Database, id: string, error: string) {
	await db
		.update(aiJobs)
		.set({ status: "failed", error, updatedAt: new Date() })
		.where(eq(aiJobs.id, id));
}
