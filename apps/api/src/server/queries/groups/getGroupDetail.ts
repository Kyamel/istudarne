import { desc, eq } from "drizzle-orm";
import type { Database } from "../../db/client";
import { quizzes, studyGroupMembers, studyGroupQuizzes, studyGroups, users } from "../../db/schema";
import type { GroupDetail } from "../../domain/types";
import { attachTags, summaryColumns } from "../shared";

export async function getGroupDetail(
	db: Database,
	groupId: string,
	viewerId: string,
): Promise<GroupDetail | null> {
	const [group] = await db.select().from(studyGroups).where(eq(studyGroups.id, groupId)).limit(1);
	if (!group) return null;

	const members = await db
		.select({
			userId: studyGroupMembers.userId,
			role: studyGroupMembers.role,
			username: users.username,
			displayName: users.displayName,
		})
		.from(studyGroupMembers)
		.innerJoin(users, eq(users.id, studyGroupMembers.userId))
		.where(eq(studyGroupMembers.groupId, groupId));

	const sharedRows = await db
		.select(summaryColumns)
		.from(studyGroupQuizzes)
		.innerJoin(quizzes, eq(quizzes.id, studyGroupQuizzes.quizId))
		.innerJoin(users, eq(users.id, quizzes.ownerId))
		.where(eq(studyGroupQuizzes.groupId, groupId))
		.orderBy(desc(studyGroupQuizzes.createdAt));

	return {
		id: group.id,
		name: group.name,
		description: group.description,
		visibility: group.visibility,
		ownerId: group.ownerId,
		role: members.find((member) => member.userId === viewerId)?.role ?? null,
		members,
		quizzes: await attachTags(db, sharedRows),
	};
}
