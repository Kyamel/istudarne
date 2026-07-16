import type { Database } from "../db/client";
import { followUser } from "../queries/social/followUser";
import { getProfile } from "../queries/social/getProfile";
import { unfollowUser } from "../queries/social/unfollowUser";

export function createSocialRepository(db: Database) {
	return {
		profile: (username: string, viewerId: string | null) => getProfile(db, username, viewerId),
		follow: (followerId: string, followingId: string) => followUser(db, followerId, followingId),
		unfollow: (followerId: string, followingId: string) =>
			unfollowUser(db, followerId, followingId),
	};
}

export type SocialRepository = ReturnType<typeof createSocialRepository>;
