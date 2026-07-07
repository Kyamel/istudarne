import { desc, eq } from "drizzle-orm";
import type { Database } from "../../db/client";
import { quizzes, users } from "../../db/schema";
import { attachTags, summaryColumns } from "../shared";

export async function listUserQuizzes(db: Database, ownerId: string) {
	const rows = await db
		.select(summaryColumns)
		.from(quizzes)
		.innerJoin(users, eq(users.id, quizzes.ownerId))
		.where(eq(quizzes.ownerId, ownerId))
		.orderBy(desc(quizzes.updatedAt))
		.limit(60);
	return attachTags(db, rows);
}
