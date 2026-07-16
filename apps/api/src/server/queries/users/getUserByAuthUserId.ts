import { eq } from "drizzle-orm";
import type { Database } from "../../db/client";
import { users } from "../../db/schema";

/** The full domain profile linked to a Better Auth user (used by the session
 *  middleware to resolve `authUser` → `domainUser`). */
export async function getUserByAuthUserId(db: Database, authUserId: string) {
	const [row] = await db.select().from(users).where(eq(users.authUserId, authUserId)).limit(1);
	return row ?? null;
}
