import { and, desc, eq, like } from "drizzle-orm";
import type { Database } from "../../db/client";
import { quizzes, users } from "../../db/schema";
import { attachTags, summaryColumns } from "../shared";

export async function listPublicQuizzes(db: Database, query: string) {
	const trimmed = query.trim();
	const rows = await db
		.select(summaryColumns)
		.from(quizzes)
		.innerJoin(users, eq(users.id, quizzes.ownerId))
		.where(
			and(
				eq(quizzes.visibility, "public"),
				trimmed ? like(quizzes.title, `%${trimmed}%`) : undefined,
			),
		)
		.orderBy(desc(quizzes.playsCount), desc(quizzes.createdAt))
		.limit(30);
	return attachTags(db, rows);
}
