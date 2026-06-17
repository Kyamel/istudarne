import type { Database } from "../db/client";
import { type CreateSessionInput, createSession } from "../queries/users/createSession";
import { type CreateUserInput, createUser } from "../queries/users/createUser";
import { deleteSessionByTokenHash } from "../queries/users/deleteSessionByTokenHash";
import { getSessionUser } from "../queries/users/getSessionUser";
import { getUserByEmail } from "../queries/users/getUserByEmail";
import { getUserByUsername } from "../queries/users/getUserByUsername";

export function createUserRepository(db: Database) {
	return {
		getByEmail: (email: string) => getUserByEmail(db, email),
		getByUsername: (username: string) => getUserByUsername(db, username),
		create: (input: CreateUserInput) => createUser(db, input),
		createSession: (input: CreateSessionInput) => createSession(db, input),
		deleteSession: (tokenHash: string) => deleteSessionByTokenHash(db, tokenHash),
		getSessionUser: (tokenHash: string, now: Date) => getSessionUser(db, tokenHash, now),
	};
}

export type UserRepository = ReturnType<typeof createUserRepository>;
