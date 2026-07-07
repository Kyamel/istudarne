import type { UploadedQuiz } from "@shared/contracts/quizImport";
import { eq } from "drizzle-orm";
import type { Database } from "../../db/client";
import { questionOptions, questions, quizTags, quizzes, tags } from "../../db/schema";
import type { Visibility } from "../../domain/types";
import { slugify } from "../shared";

export type ImportInput = {
	quizId: string;
	quiz: UploadedQuiz;
	ownerId: string;
	visibility: Visibility;
	sourceFileKey: string;
	normalizedTags: string[];
};

/** Persists quiz, questions, options, and normalized tags in D1. */
export async function insertImportedQuiz(db: Database, input: ImportInput) {
	const { quiz, quizId, ownerId, visibility, sourceFileKey, normalizedTags } = input;
	const now = new Date();

	await db.insert(quizzes).values({
		id: quizId,
		ownerId,
		title: quiz.title,
		description: quiz.description ?? null,
		visibility,
		sourceFileKey,
		questionCount: quiz.questions.length,
		playsCount: 0,
		createdAt: now,
		updatedAt: now,
		publishedAt: visibility === "public" ? now : null,
	});

	for (const [questionIndex, question] of quiz.questions.entries()) {
		const questionId = crypto.randomUUID();
		await db.insert(questions).values({
			id: questionId,
			quizId,
			externalId: question.id == null ? null : String(question.id),
			topic: question.topic ?? null,
			statement: question.statement,
			answer: question.answer,
			explanation: question.explanation ?? null,
			position: questionIndex,
		});

		for (const [optionIndex, option] of question.options.entries()) {
			await db.insert(questionOptions).values({
				id: crypto.randomUUID(),
				questionId,
				optionKey: option.id,
				text: option.text,
				position: optionIndex,
			});
		}
	}

	for (const tagName of normalizedTags) {
		const slug = slugify(tagName);
		if (!slug) continue;
		const tagId = crypto.randomUUID();
		await db
			.insert(tags)
			.values({ id: tagId, name: tagName, slug })
			.onConflictDoNothing({ target: tags.slug });

		const [tag] = await db.select().from(tags).where(eq(tags.slug, slug));
		if (tag) {
			await db.insert(quizTags).values({ quizId, tagId: tag.id }).onConflictDoNothing();
		}
	}
}
