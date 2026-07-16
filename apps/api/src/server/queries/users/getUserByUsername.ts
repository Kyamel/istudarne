import { eq } from "drizzle-orm";
import type { Database } from "../../db/client";
import { users } from "../../db/schema";
import { publicUserColumns } from "./publicColumns";

export async function getUserByUsername(db: Database, username: string) {
	const [row] = await db
		.select(publicUserColumns)
		.from(users)
		.where(eq(users.username, username))
		.limit(1);
	return row ?? null;
}
