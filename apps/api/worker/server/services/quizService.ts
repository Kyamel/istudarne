import { parseUploadedQuiz, type UploadedQuiz } from "@istudarne/contracts";
import type { QuizDetail, QuizSummary, Visibility } from "../domain/types";
import { badRequest, forbidden, notFound } from "../errors";
import type { UpdateQuizPatch } from "../queries/quizzes/updateQuizMetadata";
import { slugify } from "../queries/shared";
import type { QuizRepository } from "../repositories/quizRepository";
import type { StorageRepository } from "../repositories/storageRepository";

function normalizeTags(quiz: UploadedQuiz) {
	const fromTopics = quiz.questions
		.map((question) => question.topic)
		.filter((topic): topic is string => Boolean(topic));

	return [...(quiz.tags ?? []), ...fromTopics]
		.map((tag) => tag.trim())
		.filter(Boolean)
		.filter((tag, index, list) => {
			const slug = slugify(tag);
			return slug && list.findIndex((item) => slugify(item) === slug) === index;
		})
		.slice(0, 12);
}

export function createQuizService(quizzes: QuizRepository, storage: StorageRepository) {
	async function assertOwner(quizId: string, userId: string) {
		const owner = await quizzes.owner(quizId);
		if (!owner) throw notFound("Quiz not found.");
		if (owner.ownerId !== userId) throw forbidden();
		return owner;
	}

	return {
		search: (query: string) => quizzes.listPublic(query),
		listMine: (userId: string) => quizzes.listByOwner(userId),

		async importFromJson(
			value: unknown,
			visibility: Visibility,
			owner: { id: string; username: string; displayName: string },
		): Promise<QuizSummary> {
			const quiz = parseUploadedQuiz(value);
			const quizId = crypto.randomUUID();
			const sourceFileKey = `uploads/users/${owner.id}/quizzes/${quizId}/source.json`;
			const normalizedTags = normalizeTags(quiz);

			await storage.putJson(sourceFileKey, quiz);
			await quizzes.insertImported({
				quizId,
				quiz,
				ownerId: owner.id,
				visibility,
				sourceFileKey,
				normalizedTags,
			});

			return {
				id: quizId,
				title: quiz.title,
				description: quiz.description ?? null,
				visibility,
				questionCount: quiz.questions.length,
				playsCount: 0,
				ownerUsername: owner.username,
				ownerDisplayName: owner.displayName,
				tags: normalizedTags,
			};
		},

		async getForViewer(quizId: string, viewerId: string | null): Promise<QuizDetail> {
			const detail = await quizzes.detail(quizId);
			if (!detail) throw notFound("Quiz not found.");
			if (detail.visibility === "private" && detail.ownerId !== viewerId) {
				throw forbidden("This quiz is private.");
			}
			return detail;
		},

		async update(quizId: string, userId: string, patch: UpdateQuizPatch) {
			await assertOwner(quizId, userId);
			await quizzes.updateMetadata(quizId, patch);
			const summary = await quizzes.summary(quizId);
			if (!summary) throw notFound("Quiz not found.");
			return summary;
		},

		async remove(quizId: string, userId: string) {
			await assertOwner(quizId, userId);
			await quizzes.remove(quizId);
		},

		async setVisibility(quizId: string, userId: string, visibility: Visibility) {
			await assertOwner(quizId, userId);
			await quizzes.setVisibility(quizId, visibility);
			const summary = await quizzes.summary(quizId);
			if (!summary) throw notFound("Quiz not found.");
			return summary;
		},

		async ensurePlayable(quizId: string, userId: string) {
			const owner = await quizzes.owner(quizId);
			if (!owner) throw notFound("Quiz not found.");
			if (owner.visibility === "private" && owner.ownerId !== userId) {
				throw forbidden("This quiz is private.");
			}
			return owner;
		},

		parseError: badRequest,
	};
}

export type QuizService = ReturnType<typeof createQuizService>;
