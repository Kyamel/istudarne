import { eq } from "drizzle-orm";
import type { Database } from "../../db/client";
import { users } from "../../db/schema";
import type { AuthUser } from "../../domain/types";
import { publicUserColumns } from "./publicColumns";

export async function getUserById(db: Database, id: string): Promise<AuthUser | null> {
	const [row] = await db.select(publicUserColumns).from(users).where(eq(users.id, id)).limit(1);
	if (!row) return null;
	return {
		id: row.id,
		email: row.email,
		username: row.username,
		displayName: row.displayName,
		bio: row.bio,
		avatarUrl: row.avatarUrl,
		emailVerified: row.emailVerifiedAt !== null,
	};
}
