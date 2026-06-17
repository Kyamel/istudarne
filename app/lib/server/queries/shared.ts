import { eq, inArray } from "drizzle-orm";
import type { Database } from "../db/client";
import { quizTags, quizzes, tags, users } from "../db/schema";
import type { QuizSummary } from "../domain/types";

/** Reusable columns for building a QuizSummary with owner data. */
export const summaryColumns = {
	id: quizzes.id,
	title: quizzes.title,
	description: quizzes.description,
	visibility: quizzes.visibility,
	questionCount: quizzes.questionCount,
	playsCount: quizzes.playsCount,
	ownerUsername: users.username,
	ownerDisplayName: users.displayName,
};

/** Attaches each quiz's tags with one aggregated query. */
export async function attachTags(
	db: Database,
	rows: Omit<QuizSummary, "tags">[],
): Promise<QuizSummary[]> {
	if (rows.length === 0) return [];
	const ids = rows.map((row) => row.id);
	const tagRows = await db
		.select({ quizId: quizTags.quizId, name: tags.name })
		.from(quizTags)
		.innerJoin(tags, eq(tags.id, quizTags.tagId))
		.where(inArray(quizTags.quizId, ids));

	const byQuiz = new Map<string, string[]>();
	for (const tagRow of tagRows) {
		const list = byQuiz.get(tagRow.quizId) ?? [];
		list.push(tagRow.name);
		byQuiz.set(tagRow.quizId, list);
	}

	return rows.map((row) => ({ ...row, tags: byQuiz.get(row.id) ?? [] }));
}

export function slugify(value: string) {
	return value
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 64);
}
