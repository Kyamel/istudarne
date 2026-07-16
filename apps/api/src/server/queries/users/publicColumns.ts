import { users } from "../../db/schema";

/** App-facing profile columns (the whole domain `users` row is safe to expose). */
export const publicUserColumns = {
	id: users.id,
	username: users.username,
	displayName: users.displayName,
	bio: users.bio,
	avatarUrl: users.avatarUrl,
};
