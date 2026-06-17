import { and, eq, ne } from "drizzle-orm";
import type { Database } from "../../db/client";
import { studyGroupMembers } from "../../db/schema";

export async function leaveGroup(db: Database, groupId: string, userId: string) {
	await db
		.delete(studyGroupMembers)
		.where(
			and(
				eq(studyGroupMembers.groupId, groupId),
				eq(studyGroupMembers.userId, userId),
				ne(studyGroupMembers.role, "owner"),
			),
		);
}
