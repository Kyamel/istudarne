import { and, desc, eq, sql } from "drizzle-orm";
import type { Database } from "../../db/client";
import { chatMessages, users } from "../../db/schema";
import type { ChatMessage } from "../../domain/types";

export async function listGroupMessages(db: Database, groupId: string): Promise<ChatMessage[]> {
	const rows = await db
		.select({
			id: chatMessages.id,
			body: chatMessages.body,
			senderId: chatMessages.senderId,
			displayName: users.displayName,
			createdAt: chatMessages.createdAt,
		})
		.from(chatMessages)
		.innerJoin(users, eq(users.id, chatMessages.senderId))
		.where(and(eq(chatMessages.groupId, groupId), sql`${chatMessages.deletedAt} is null`))
		.orderBy(desc(chatMessages.createdAt))
		.limit(50);

	return rows.map((row) => ({ ...row, createdAt: row.createdAt.getTime() })).reverse();
}
