import type { Database } from "../db/client";
import type { Visibility } from "../domain/types";
import { deleteQuiz } from "../queries/quizzes/deleteQuiz";
import { getQuizDetail } from "../queries/quizzes/getQuizDetail";
import { getQuizOwner } from "../queries/quizzes/getQuizOwner";
import { getQuizSummary } from "../queries/quizzes/getQuizSummary";
import { type ImportInput, insertImportedQuiz } from "../queries/quizzes/insertImportedQuiz";
import { listPublicQuizzes } from "../queries/quizzes/listPublicQuizzes";
import { listUserQuizzes } from "../queries/quizzes/listUserQuizzes";
import { setQuizVisibility } from "../queries/quizzes/setQuizVisibility";
import { type UpdateQuizPatch, updateQuizMetadata } from "../queries/quizzes/updateQuizMetadata";

export function createQuizRepository(db: Database) {
	return {
		listPublic: (query: string) => listPublicQuizzes(db, query),
		listByOwner: (ownerId: string) => listUserQuizzes(db, ownerId),
		summary: (quizId: string) => getQuizSummary(db, quizId),
		detail: (quizId: string) => getQuizDetail(db, quizId),
		owner: (quizId: string) => getQuizOwner(db, quizId),
		updateMetadata: (quizId: string, patch: UpdateQuizPatch) =>
			updateQuizMetadata(db, quizId, patch),
		setVisibility: (quizId: string, visibility: Visibility) =>
			setQuizVisibility(db, quizId, visibility),
		remove: (quizId: string) => deleteQuiz(db, quizId),
		insertImported: (input: ImportInput) => insertImportedQuiz(db, input),
	};
}

export type QuizRepository = ReturnType<typeof createQuizRepository>;
