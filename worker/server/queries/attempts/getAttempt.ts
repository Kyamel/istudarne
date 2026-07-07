import { eq } from "drizzle-orm";
import type { Database } from "../../db/client";
import { quizAttempts } from "../../db/schema";

export async function getAttempt(db: Database, attemptId: string) {
	const [row] = await db.select().from(quizAttempts).where(eq(quizAttempts.id, attemptId)).limit(1);
	return row ?? null;
}
