import { eq } from "drizzle-orm";
import type { Database } from "../../db/client";
import { quizzes } from "../../db/schema";

export async function deleteQuiz(db: Database, quizId: string) {
	await db.delete(quizzes).where(eq(quizzes.id, quizId));
}
