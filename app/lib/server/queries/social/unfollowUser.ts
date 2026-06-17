import { and, eq } from "drizzle-orm";
import type { Database } from "../../db/client";
import { follows } from "../../db/schema";

export async function unfollowUser(db: Database, followerId: string, followingId: string) {
	await db
		.delete(follows)
		.where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
}
