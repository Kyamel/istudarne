import type { Database } from "../../db/client";
import { quizAttempts } from "../../db/schema";
import type { AttemptMode } from "../../domain/types";

export async function createAttempt(
	db: Database,
	input: { quizId: string; userId: string; mode: AttemptMode },
) {
	const id = crypto.randomUUID();
	await db.insert(quizAttempts).values({
		id,
		quizId: input.quizId,
		userId: input.userId,
		mode: input.mode,
		status: "in_progress",
	});
	return id;
}
