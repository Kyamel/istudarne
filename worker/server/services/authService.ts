import { generateSessionToken, hashPassword, sha256Hex, verifyPassword } from "../auth/crypto";
import type { AuthUser } from "../domain/types";
import { conflict, unauthorized } from "../errors";
import type { UserRepository } from "../repositories/userRepository";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export type RegisterInput = {
	email: string;
	username: string;
	displayName: string;
	password: string;
};

export const SESSION_TTL_SECONDS = Math.floor(SESSION_TTL_MS / 1000);

export function createAuthService(users: UserRepository) {
	async function issueSession(userId: string) {
		const token = generateSessionToken();
		await users.createSession({
			id: crypto.randomUUID(),
			userId,
			tokenHash: await sha256Hex(token),
			expiresAt: new Date(Date.now() + SESSION_TTL_MS),
		});
		return token;
	}

	return {
		async register(input: RegisterInput): Promise<{ user: AuthUser; token: string }> {
			if (await users.getByEmail(input.email)) {
				throw conflict("This email is already in use.");
			}
			if (await users.getByUsername(input.username)) {
				throw conflict("This username is already taken.");
			}

			const passwordHash = await hashPassword(input.password);
			const { id } = await users.create({
				email: input.email,
				username: input.username,
				displayName: input.displayName,
				passwordHash,
			});

			return {
				user: {
					id,
					email: input.email.toLowerCase(),
					username: input.username,
					displayName: input.displayName,
					bio: null,
					avatarUrl: null,
				},
				token: await issueSession(id),
			};
		},

		async login(email: string, password: string): Promise<{ user: AuthUser; token: string }> {
			const user = await users.getByEmail(email);
			if (!user || !(await verifyPassword(password, user.passwordHash))) {
				throw unauthorized("Incorrect email or password.");
			}
			return {
				user: {
					id: user.id,
					email: user.email,
					username: user.username,
					displayName: user.displayName,
					bio: user.bio,
					avatarUrl: user.avatarUrl,
				},
				token: await issueSession(user.id),
			};
		},

		async authenticate(token: string): Promise<AuthUser | null> {
			return users.getSessionUser(await sha256Hex(token), new Date());
		},

		async endSession(token: string) {
			await users.deleteSession(await sha256Hex(token));
		},
	};
}

export type AuthService = ReturnType<typeof createAuthService>;
