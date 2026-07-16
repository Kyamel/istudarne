import { and, desc, eq, sql } from "drizzle-orm";
import type { Database } from "../../db/client";
import { follows, quizzes, users } from "../../db/schema";
import type { Profile } from "../../domain/types";
import { attachTags, summaryColumns } from "../shared";
import { getUserStats } from "../stats/getUserStats";
import { getUserByUsername } from "../users/getUserByUsername";

export async function getProfile(
	db: Database,
	username: string,
	viewerId: string | null,
): Promise<Profile | null> {
	const user = await getUserByUsername(db, username);
	if (!user) return null;

	const [followers] = await db
		.select({ count: sql<number>`count(*)` })
		.from(follows)
		.where(eq(follows.followingId, user.id));
	const [following] = await db
		.select({ count: sql<number>`count(*)` })
		.from(follows)
		.where(eq(follows.followerId, user.id));

	const ownRows = await db
		.select(summaryColumns)
		.from(quizzes)
		.innerJoin(users, eq(users.id, quizzes.ownerId))
		.where(
			and(
				eq(quizzes.ownerId, user.id),
				viewerId === user.id ? undefined : eq(quizzes.visibility, "public"),
			),
		)
		.orderBy(desc(quizzes.createdAt))
		.limit(20);

	let isFollowing = false;
	if (viewerId && viewerId !== user.id) {
		const [row] = await db
			.select({ followerId: follows.followerId })
			.from(follows)
			.where(and(eq(follows.followerId, viewerId), eq(follows.followingId, user.id)))
			.limit(1);
		isFollowing = Boolean(row);
	}

	return {
		id: user.id,
		username: user.username,
		displayName: user.displayName,
		bio: user.bio,
		avatarUrl: user.avatarUrl,
		followers: Number(followers?.count ?? 0),
		following: Number(following?.count ?? 0),
		stats: await getUserStats(db, user.id),
		quizzes: await attachTags(db, ownRows),
		isFollowing,
	};
}
