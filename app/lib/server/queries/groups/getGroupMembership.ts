import { and, eq } from "drizzle-orm";
import type { Database } from "../../db/client";
import { studyGroupMembers } from "../../db/schema";

export async function getGroupMembership(db: Database, groupId: string, userId: string) {
	const [row] = await db
		.select({ role: studyGroupMembers.role })
		.from(studyGroupMembers)
		.where(and(eq(studyGroupMembers.groupId, groupId), eq(studyGroupMembers.userId, userId)))
		.limit(1);
	return row?.role ?? null;
}
