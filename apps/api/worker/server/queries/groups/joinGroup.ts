import type { Database } from "../../db/client";
import { studyGroupMembers } from "../../db/schema";

export async function joinGroup(db: Database, groupId: string, userId: string) {
	await db
		.insert(studyGroupMembers)
		.values({ groupId, userId, role: "member" })
		.onConflictDoNothing();
}
