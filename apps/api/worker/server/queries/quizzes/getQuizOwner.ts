import { eq } from "drizzle-orm";
import type { Database } from "../../db/client";
import { quizzes } from "../../db/schema";

export async function getQuizOwner(db: Database, quizId: string) {
	const [row] = await db
		.select({ ownerId: quizzes.ownerId, visibility: quizzes.visibility })
		.from(quizzes)
		.where(eq(quizzes.id, quizId))
		.limit(1);
	return row ?? null;
}
