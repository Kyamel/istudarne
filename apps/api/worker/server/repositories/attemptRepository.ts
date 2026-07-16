import type { Database } from "../db/client";
import type { AttemptMode } from "../domain/types";
import { createAttempt } from "../queries/attempts/createAttempt";
import { finishAttempt } from "../queries/attempts/finishAttempt";
import { getAttempt } from "../queries/attempts/getAttempt";
import { recordAnswer } from "../queries/attempts/recordAnswer";

export function createAttemptRepository(db: Database) {
	return {
		create: (input: { quizId: string; userId: string; mode: AttemptMode }) =>
			createAttempt(db, input),
		get: (attemptId: string) => getAttempt(db, attemptId),
		recordAnswer: (input: {
			attemptId: string;
			questionId: string;
			selectedOption: string;
			timeSpentMs?: number;
		}) => recordAnswer(db, input),
		finish: (attemptId: string, userId: string, quizId: string) =>
			finishAttempt(db, attemptId, userId, quizId),
	};
}

export type AttemptRepository = ReturnType<typeof createAttemptRepository>;
