import { eq } from "drizzle-orm";
import type { Database } from "../../db/client";
import { sessions } from "../../db/schema";

export async function deleteSessionByTokenHash(db: Database, tokenHash: string) {
	await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
}
