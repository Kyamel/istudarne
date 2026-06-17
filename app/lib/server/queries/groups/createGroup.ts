import type { Database } from "../../db/client";
import { studyGroupMembers, studyGroups } from "../../db/schema";
import type { GroupVisibility } from "../../domain/types";

export async function createGroup(
	db: Database,
	input: {
		ownerId: string;
		name: string;
		description?: string | null;
		visibility: GroupVisibility;
	},
) {
	const id = crypto.randomUUID();
	const now = new Date();
	await db.insert(studyGroups).values({
		id,
		ownerId: input.ownerId,
		name: input.name,
		description: input.description ?? null,
		visibility: input.visibility,
		createdAt: now,
		updatedAt: now,
	});
	await db.insert(studyGroupMembers).values({
		groupId: id,
		userId: input.ownerId,
		role: "owner",
	});
	return id;
}
