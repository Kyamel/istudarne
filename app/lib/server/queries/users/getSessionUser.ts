import { eq } from "drizzle-orm";
import type { Database } from "../../db/client";
import { sessions, users } from "../../db/schema";
import type { AuthUser } from "../../domain/types";
import { deleteSessionByTokenHash } from "./deleteSessionByTokenHash";
import { publicUserColumns } from "./publicColumns";

export async function getSessionUser(
	db: Database,
	tokenHash: string,
	now: Date,
): Promise<AuthUser | null> {
	const [row] = await db
		.select({ ...publicUserColumns, expiresAt: sessions.expiresAt })
		.from(sessions)
		.innerJoin(users, eq(users.id, sessions.userId))
		.where(eq(sessions.tokenHash, tokenHash))
		.limit(1);

	if (!row) return null;
	if (row.expiresAt.getTime() <= now.getTime()) {
		await deleteSessionByTokenHash(db, tokenHash);
		return null;
	}

	return {
		id: row.id,
		email: row.email,
		username: row.username,
		displayName: row.displayName,
		bio: row.bio,
		avatarUrl: row.avatarUrl,
	};
}
