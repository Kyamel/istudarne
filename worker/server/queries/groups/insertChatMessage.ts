import type { Database } from "../../db/client";
import { chatMessages } from "../../db/schema";

export async function insertChatMessage(
	db: Database,
	input: { id: string; groupId: string; senderId: string; body: string },
) {
	await db.insert(chatMessages).values(input);
}
