import type { Database } from "../../db/client";
import { follows } from "../../db/schema";

export async function followUser(db: Database, followerId: string, followingId: string) {
	await db.insert(follows).values({ followerId, followingId }).onConflictDoNothing();
}
