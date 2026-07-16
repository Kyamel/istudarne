import { eq } from "drizzle-orm";
import type { Database } from "../../db/client";
import { quizzes, users } from "../../db/schema";
import { attachTags, summaryColumns } from "../shared";

export async function getQuizSummary(db: Database, quizId: string) {
	const rows = await db
		.select(summaryColumns)
		.from(quizzes)
		.innerJoin(users, eq(users.id, quizzes.ownerId))
		.where(eq(quizzes.id, quizId))
		.limit(1);
	const [withTags] = await attachTags(db, rows);
	return withTags ?? null;
}
