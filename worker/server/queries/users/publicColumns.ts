import { users } from "../../db/schema";

/** Safe user columns, excluding the password hash. */
export const publicUserColumns = {
	id: users.id,
	email: users.email,
	username: users.username,
	displayName: users.displayName,
	bio: users.bio,
	avatarUrl: users.avatarUrl,
	emailVerifiedAt: users.emailVerifiedAt,
};
