import { eq } from "drizzle-orm";
import type { Database } from "../../db/client";
import { quizzes } from "../../db/schema";
import type { Visibility } from "../../domain/types";

export async function setQuizVisibility(db: Database, quizId: string, visibility: Visibility) {
	const now = new Date();
	await db
		.update(quizzes)
		.set({
			visibility,
			updatedAt: now,
			publishedAt: visibility === "public" ? now : null,
		})
		.where(eq(quizzes.id, quizId));
}
