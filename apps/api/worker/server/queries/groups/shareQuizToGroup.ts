import type { Database } from "../../db/client";
import { studyGroupQuizzes } from "../../db/schema";

export async function shareQuizToGroup(
	db: Database,
	input: { groupId: string; quizId: string; sharedBy: string },
) {
	await db.insert(studyGroupQuizzes).values(input).onConflictDoNothing();
}
