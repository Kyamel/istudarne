import { eq } from "drizzle-orm";
import type { Database } from "../../db/client";
import { users } from "../../db/schema";

export async function getUserByEmail(db: Database, email: string) {
	const [row] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
	return row ?? null;
}
