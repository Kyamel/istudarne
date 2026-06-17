import type { AttemptMode } from "../domain/types";
import { forbidden, notFound } from "../errors";
import type { AttemptRepository } from "../repositories/attemptRepository";
import type { QuizRepository } from "../repositories/quizRepository";

export function createAttemptService(attempts: AttemptRepository, quizzes: QuizRepository) {
	async function ownedAttempt(attemptId: string, userId: string) {
		const attempt = await attempts.get(attemptId);
		if (!attempt || attempt.userId !== userId) {
			throw notFound("Attempt not found.");
		}
		return attempt;
	}

	return {
		async start(quizId: string, userId: string, mode: AttemptMode) {
			const owner = await quizzes.owner(quizId);
			if (!owner) throw notFound("Quiz not found.");
			if (owner.visibility === "private" && owner.ownerId !== userId) {
				throw forbidden("This quiz is private.");
			}
			return attempts.create({ quizId, userId, mode });
		},

		async answer(
			attemptId: string,
			userId: string,
			input: { questionId: string; selectedOption: string; timeSpentMs?: number },
		) {
			const attempt = await ownedAttempt(attemptId, userId);
			return attempts.recordAnswer({ attemptId: attempt.id, ...input });
		},

		async finish(attemptId: string, userId: string) {
			const attempt = await ownedAttempt(attemptId, userId);
			return attempts.finish(attempt.id, userId, attempt.quizId);
		},
	};
}

export type AttemptService = ReturnType<typeof createAttemptService>;
