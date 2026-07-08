import { generateToken, hashPassword, sha256Hex, verifyPassword } from "../auth/crypto";
import { ACCESS_TOKEN_TTL_SECONDS, signAccessToken, verifyAccessToken } from "../auth/jwt";
import type { AuthUser } from "../domain/types";
import { badRequest, conflict, forbidden, unauthorized } from "../errors";
import type { UserRepository } from "../repositories/userRepository";

const REFRESH_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
const EMAIL_VERIFICATION_TTL_MS = 1000 * 60 * 60 * 24 * 2; // 2 days

export const REFRESH_TOKEN_TTL_SECONDS = Math.floor(REFRESH_TOKEN_TTL_MS / 1000);
export { ACCESS_TOKEN_TTL_SECONDS };

export type RegisterInput = {
	email: string;
	username: string;
	displayName: string;
	password: string;
};

export type AuthTokens = {
	accessToken: string;
	refreshToken: string;
	expiresIn: number;
	tokenType: "Bearer";
};

type UserRow = NonNullable<Awaited<ReturnType<UserRepository["getByEmail"]>>>;

function toAuthUser(row: UserRow): AuthUser {
	return {
		id: row.id,
		email: row.email,
		username: row.username,
		displayName: row.displayName,
		bio: row.bio,
		avatarUrl: row.avatarUrl,
		emailVerified: row.emailVerifiedAt !== null,
	};
}

export function createAuthService(users: UserRepository, jwtSecret: string) {
	async function issueTokens(userId: string): Promise<AuthTokens> {
		const refreshToken = generateToken();
		await users.createRefreshToken({
			id: crypto.randomUUID(),
			userId,
			tokenHash: await sha256Hex(refreshToken),
			expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
		});
		return {
			accessToken: await signAccessToken(jwtSecret, userId),
			refreshToken,
			expiresIn: ACCESS_TOKEN_TTL_SECONDS,
			tokenType: "Bearer",
		};
	}

	async function issueEmailVerificationToken(userId: string): Promise<string> {
		const token = generateToken();
		await users.createEmailVerificationToken({
			id: crypto.randomUUID(),
			userId,
			tokenHash: await sha256Hex(token),
			expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
		});
		return token;
	}

	return {
		/**
		 * Creates the account but does NOT sign the user in: email verification
		 * is required before the first login, so no tokens are issued here.
		 */
		async register(input: RegisterInput): Promise<{
			user: AuthUser;
			verificationToken: string;
		}> {
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
					emailVerified: false,
				},
				verificationToken: await issueEmailVerificationToken(id),
			};
		},

		async login(email: string, password: string): Promise<{ user: AuthUser; tokens: AuthTokens }> {
			const user = await users.getByEmail(email);
			if (!user || !(await verifyPassword(password, user.passwordHash))) {
				throw unauthorized("Incorrect email or password.");
			}
			if (user.emailVerifiedAt === null) {
				throw forbidden(
					"Please verify your email before signing in. Check your inbox for the verification link.",
				);
			}
			return { user: toAuthUser(user), tokens: await issueTokens(user.id) };
		},

		/**
		 * Rotates the refresh token: the presented token is revoked and a new
		 * pair is issued. Presenting an already-revoked token means it leaked
		 * (or the client was cloned), so every session of that user is revoked.
		 */
		async refresh(refreshToken: string): Promise<{ user: AuthUser; tokens: AuthTokens }> {
			const row = await users.getRefreshTokenByHash(await sha256Hex(refreshToken));
			if (!row) throw unauthorized("Invalid session. Please sign in again.");

			if (row.revokedAt) {
				await users.revokeAllRefreshTokens(row.userId);
				throw unauthorized("Session revoked. Please sign in again.");
			}
			if (row.expiresAt.getTime() <= Date.now()) {
				throw unauthorized("Session expired. Please sign in again.");
			}

			const user = await users.getById(row.userId);
			if (!user) throw unauthorized("Invalid session. Please sign in again.");

			const tokens = await issueTokens(row.userId);
			await users.revokeRefreshToken(row.id, await sha256Hex(tokens.refreshToken));
			return { user, tokens };
		},

		/** Verifies a stateless JWT access token and loads the user. */
		async authenticate(accessToken: string): Promise<AuthUser | null> {
			const userId = await verifyAccessToken(jwtSecret, accessToken);
			return userId ? users.getById(userId) : null;
		},

		async endSession(refreshToken: string) {
			const row = await users.getRefreshTokenByHash(await sha256Hex(refreshToken));
			if (row && !row.revokedAt) await users.revokeRefreshToken(row.id);
		},

		async verifyEmail(token: string): Promise<void> {
			const row = await users.getEmailVerificationTokenByHash(await sha256Hex(token));
			if (!row || row.usedAt || row.expiresAt.getTime() <= Date.now()) {
				throw badRequest("Invalid or expired verification link.");
			}
			await users.markEmailVerificationTokenUsed(row.id);
			await users.markEmailVerified(row.userId);
		},

		/**
		 * Issues a fresh verification token for an unverified account. Returns
		 * null when the email is unknown or already verified so the route can
		 * answer identically either way (no account enumeration).
		 */
		async requestEmailVerification(
			email: string,
		): Promise<{ user: AuthUser; token: string } | null> {
			const user = await users.getByEmail(email);
			if (!user || user.emailVerifiedAt !== null) return null;
			return { user: toAuthUser(user), token: await issueEmailVerificationToken(user.id) };
		},
	};
}

export type AuthService = ReturnType<typeof createAuthService>;
