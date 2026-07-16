import type { Database } from "../db/client";
import { getUserByAuthUserId } from "../queries/users/getUserByAuthUserId";
import { getUserById } from "../queries/users/getUserById";
import { getUserByUsername } from "../queries/users/getUserByUsername";

/**
 * Domain profile reads. Identity and credentials are owned by Better Auth
 * (worker/auth.ts) — this repository only exposes the app-facing `users` rows.
 */
export function createUserRepository(db: Database) {
	return {
		getByUsername: (username: string) => getUserByUsername(db, username),
		getById: (id: string) => getUserById(db, id),
		getByAuthUserId: (authUserId: string) => getUserByAuthUserId(db, authUserId),
	};
}

export type UserRepository = ReturnType<typeof createUserRepository>;
