import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import type { Database } from "../../db/client";
import { studyGroupMembers, studyGroups } from "../../db/schema";
import type { GroupSummary } from "../../domain/types";

export async function listGroups(db: Database, viewerId: string): Promise<GroupSummary[]> {
	const rows = await db
		.select({
			id: studyGroups.id,
			name: studyGroups.name,
			description: studyGroups.description,
			visibility: studyGroups.visibility,
		})
		.from(studyGroups)
		.where(
			or(
				eq(studyGroups.visibility, "public"),
				sql`${studyGroups.id} in (select group_id from study_group_members where user_id = ${viewerId})`,
			),
		)
		.orderBy(desc(studyGroups.updatedAt))
		.limit(40);

	if (rows.length === 0) return [];

	const ids = rows.map((row) => row.id);
	const counts = await db
		.select({
			groupId: studyGroupMembers.groupId,
			count: sql<number>`count(*)`,
		})
		.from(studyGroupMembers)
		.where(inArray(studyGroupMembers.groupId, ids))
		.groupBy(studyGroupMembers.groupId);
	const countByGroup = new Map(counts.map((row) => [row.groupId, Number(row.count)]));

	const memberships = await db
		.select({ groupId: studyGroupMembers.groupId, role: studyGroupMembers.role })
		.from(studyGroupMembers)
		.where(and(eq(studyGroupMembers.userId, viewerId), inArray(studyGroupMembers.groupId, ids)));
	const roleByGroup = new Map(memberships.map((row) => [row.groupId, row.role]));

	return rows.map((row) => ({
		...row,
		memberCount: countByGroup.get(row.id) ?? 0,
		isMember: roleByGroup.has(row.id),
		role: roleByGroup.get(row.id) ?? null,
	}));
}
