import { eq } from "drizzle-orm";
import type { Database } from "../../db/client";
import { quizTags, quizzes, tags } from "../../db/schema";
import type { Visibility } from "../../domain/types";
import { slugify } from "../shared";

export type UpdateQuizPatch = {
	title?: string;
	description?: string | null;
	visibility?: Visibility;
	tags?: string[];
};

export async function updateQuizMetadata(db: Database, quizId: string, patch: UpdateQuizPatch) {
	const now = new Date();
	const fields: Record<string, unknown> = { updatedAt: now };
	if (patch.title !== undefined) fields.title = patch.title;
	if (patch.description !== undefined) fields.description = patch.description;
	if (patch.visibility !== undefined) {
		fields.visibility = patch.visibility;
		fields.publishedAt = patch.visibility === "public" ? now : null;
	}
	await db.update(quizzes).set(fields).where(eq(quizzes.id, quizId));

	if (patch.tags) {
		await db.delete(quizTags).where(eq(quizTags.quizId, quizId));
		for (const tagName of patch.tags) {
			const slug = slugify(tagName);
			if (!slug) continue;
			const tagId = crypto.randomUUID();
			await db
				.insert(tags)
				.values({ id: tagId, name: tagName.trim(), slug })
				.onConflictDoNothing({ target: tags.slug });
			const [tag] = await db.select().from(tags).where(eq(tags.slug, slug));
			if (tag) {
				await db.insert(quizTags).values({ quizId, tagId: tag.id }).onConflictDoNothing();
			}
		}
	}
}
