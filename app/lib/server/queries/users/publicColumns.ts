import { users } from "../../db/schema";

/** Colunas seguras de usuário (sem hash de senha). */
export const publicUserColumns = {
	id: users.id,
	email: users.email,
	username: users.username,
	displayName: users.displayName,
	bio: users.bio,
	avatarUrl: users.avatarUrl,
};
