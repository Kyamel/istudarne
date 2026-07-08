import type { Database } from "../db/client";
import { type CreateUserInput, createUser } from "../queries/users/createUser";
import {
	type CreateEmailVerificationTokenInput,
	getEmailVerificationTokenByHash,
	insertEmailVerificationToken,
	markEmailVerificationTokenUsed,
	markUserEmailVerified,
} from "../queries/users/emailVerification";
import { getUserByEmail } from "../queries/users/getUserByEmail";
import { getUserById } from "../queries/users/getUserById";
import { getUserByUsername } from "../queries/users/getUserByUsername";
import {
	type CreateRefreshTokenInput,
	getRefreshTokenByHash,
	insertRefreshToken,
	revokeAllUserRefreshTokens,
	revokeRefreshToken,
} from "../queries/users/refreshTokens";

export function createUserRepository(db: Database) {
	return {
		getByEmail: (email: string) => getUserByEmail(db, email),
		getByUsername: (username: string) => getUserByUsername(db, username),
		getById: (id: string) => getUserById(db, id),
		create: (input: CreateUserInput) => createUser(db, input),

		createRefreshToken: (input: CreateRefreshTokenInput) => insertRefreshToken(db, input),
		getRefreshTokenByHash: (tokenHash: string) => getRefreshTokenByHash(db, tokenHash),
		revokeRefreshToken: (id: string, replacedById: string | null = null) =>
			revokeRefreshToken(db, id, replacedById),
		revokeAllRefreshTokens: (userId: string) => revokeAllUserRefreshTokens(db, userId),

		createEmailVerificationToken: (input: CreateEmailVerificationTokenInput) =>
			insertEmailVerificationToken(db, input),
		getEmailVerificationTokenByHash: (tokenHash: string) =>
			getEmailVerificationTokenByHash(db, tokenHash),
		markEmailVerificationTokenUsed: (id: string) => markEmailVerificationTokenUsed(db, id),
		markEmailVerified: (userId: string) => markUserEmailVerified(db, userId),
	};
}

export type UserRepository = ReturnType<typeof createUserRepository>;
