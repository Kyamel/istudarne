/**
 * Auth module — business logic. Framework-touch is limited to HTTPException
 * (so any Hono app maps errors without custom classes); persistence goes
 * through the AuthStore interface.
 *
 * Model: HS256 JWT access tokens (stateless) + opaque refresh tokens (SHA-256
 * hashed at rest, rotated on every refresh) + single-use email-verification and
 * password-reset tokens with a resend cooldown. Rotating a refresh token records
 * its successor, so a replay is recognised: outside the leeway window it is
 * treated as theft and revokes every session; inside it, it is just a racing
 * parallel request (see policy.ts). Email verification is required before login
 * by default, but a host can relax that to "optional" through the policy.
 */
import { HTTPException } from "hono/http-exception";
import type { AuthTokens, AuthUser, RegisterRequest } from "./contracts";
import { generateToken, hashPassword, sha256Hex, verifyPassword } from "./crypto";
import { signAccessToken, verifyAccessToken } from "./jwt";
import { type AuthPolicy, DEFAULT_AUTH_POLICY } from "./policy";
import type { AuthStore, CredentialsRecord, RefreshTokenRecord } from "./store";

/* Kept for the cookie transport, which needs the maxAge of the default policy. */
export const ACCESS_TOKEN_TTL_SECONDS = DEFAULT_AUTH_POLICY.accessTokenTtlSeconds;
export const REFRESH_TOKEN_TTL_SECONDS = DEFAULT_AUTH_POLICY.refreshTokenTtlSeconds;

const seconds = (n: number) => n * 1000;

/** Guard against a cycle or an absurd chain of racing replays. */
const MAX_ROTATION_CHAIN = 10;

function toAuthUser(row: CredentialsRecord): AuthUser {
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

export function createAuthService(
	users: AuthStore,
	jwtSecret: string,
	policy: AuthPolicy = DEFAULT_AUTH_POLICY,
) {
	async function issueTokens(
		userId: string,
	): Promise<{ tokens: AuthTokens; refreshTokenId: string }> {
		const refreshTokenId = crypto.randomUUID();
		const refreshToken = generateToken();
		await users.createRefreshToken({
			id: refreshTokenId,
			userId,
			tokenHash: await sha256Hex(refreshToken),
			expiresAt: new Date(Date.now() + seconds(policy.refreshTokenTtlSeconds)),
		});
		return {
			refreshTokenId,
			tokens: {
				accessToken: await signAccessToken(jwtSecret, userId, policy.accessTokenTtlSeconds),
				refreshToken,
				expiresIn: policy.accessTokenTtlSeconds,
				tokenType: "Bearer",
			},
		};
	}

	async function issueSingleUseToken(
		userId: string,
		kind: "email-verification" | "password-reset",
	): Promise<string> {
		const token = generateToken();
		const input = {
			id: crypto.randomUUID(),
			userId,
			tokenHash: await sha256Hex(token),
			expiresAt: new Date(
				Date.now() +
					seconds(
						kind === "email-verification"
							? policy.emailVerificationTtlSeconds
							: policy.passwordResetTtlSeconds,
					),
			),
		};

		if (kind === "email-verification") await users.createEmailVerificationToken(input);
		else await users.createPasswordResetToken(input);

		return token;
	}

	/**
	 * A rotated token replayed within the leeway window is a parallel request,
	 * not theft. `replacedById` separates the two cases: rotation records a
	 * successor, while logout and explicit revocation do not — so the leeway can
	 * never keep a deliberately revoked session alive.
	 */
	function isRacingReplay(row: RefreshTokenRecord): boolean {
		if (!row.revokedAt || row.replacedById === null) return false;
		const age = Date.now() - row.revokedAt.getTime();
		return age >= 0 && age <= seconds(policy.refreshReuseLeewaySeconds);
	}

	/** Follows `replacedById` to the one token in the chain still alive. */
	async function followChain(from: RefreshTokenRecord): Promise<RefreshTokenRecord | null> {
		let current: RefreshTokenRecord | null = from;

		for (let hop = 0; hop < MAX_ROTATION_CHAIN && current; hop++) {
			if (!current.revokedAt) return current;
			if (current.replacedById === null) return null;
			current = await users.getRefreshTokenById(current.replacedById);
		}

		return null;
	}

	return {
		/**
		 * Creates the account. No session is issued here: even when email
		 * verification is optional, the client signs in with POST /login
		 * afterwards, so registration keeps a single, simple contract.
		 */
		async register(input: RegisterRequest): Promise<{
			user: AuthUser;
			verificationToken: string;
		}> {
			if (await users.getByEmail(input.email)) {
				throw new HTTPException(409, { message: "This email is already in use." });
			}
			if (await users.getByUsername(input.username)) {
				throw new HTTPException(409, { message: "This username is already taken." });
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
				verificationToken: await issueSingleUseToken(id, "email-verification"),
			};
		},

		async login(email: string, password: string): Promise<{ user: AuthUser; tokens: AuthTokens }> {
			const user = await users.getByEmail(email);
			if (!user || !(await verifyPassword(password, user.passwordHash))) {
				throw new HTTPException(401, { message: "Incorrect email or password." });
			}
			if (policy.emailVerification === "required-for-login" && user.emailVerifiedAt === null) {
				throw new HTTPException(403, {
					message:
						"Please verify your email before signing in. Check your inbox for the verification link.",
				});
			}
			const { tokens } = await issueTokens(user.id);
			return { user: toAuthUser(user), tokens };
		},

		/**
		 * Rotates the refresh token. The presented one is revoked and points at
		 * its successor, so a later replay can be recognised. A replay inside the
		 * leeway window is a racing request: walk to the live end of the chain and
		 * rotate that, so one device keeps one session; outside it, the token
		 * leaked and every session is revoked.
		 */
		async refresh(refreshToken: string): Promise<{ user: AuthUser; tokens: AuthTokens }> {
			const presented = await users.getRefreshTokenByHash(await sha256Hex(refreshToken));
			if (!presented)
				throw new HTTPException(401, { message: "Invalid session. Please sign in again." });

			let row = presented;

			if (presented.revokedAt) {
				if (presented.replacedById === null) {
					// Signed out or explicitly revoked. Deliberate — just refuse.
					throw new HTTPException(401, { message: "Session revoked. Please sign in again." });
				}
				if (!isRacingReplay(presented)) {
					await users.revokeAllRefreshTokens(presented.userId);
					throw new HTTPException(401, { message: "Session revoked. Please sign in again." });
				}

				const live = await followChain(presented);
				if (!live)
					throw new HTTPException(401, { message: "Session revoked. Please sign in again." });
				row = live;
			}

			if (row.expiresAt.getTime() <= Date.now()) {
				throw new HTTPException(401, { message: "Session expired. Please sign in again." });
			}

			const user = await users.getById(row.userId);
			if (!user)
				throw new HTTPException(401, { message: "Invalid session. Please sign in again." });

			const { tokens, refreshTokenId } = await issueTokens(row.userId);
			await users.revokeRefreshToken(row.id, refreshTokenId);
			return { user, tokens };
		},

		/** Verifies a stateless JWT access token and loads the user. */
		async authenticate(accessToken: string): Promise<AuthUser | null> {
			const userId = await verifyAccessToken(jwtSecret, accessToken);
			return userId ? users.getById(userId) : null;
		},

		async endSession(refreshToken: string) {
			const row = await users.getRefreshTokenByHash(await sha256Hex(refreshToken));
			if (row && !row.revokedAt) await users.revokeRefreshToken(row.id, null);
		},

		async verifyEmail(token: string): Promise<void> {
			const row = await users.getEmailVerificationTokenByHash(await sha256Hex(token));
			if (!row || row.usedAt || row.expiresAt.getTime() <= Date.now()) {
				throw new HTTPException(400, { message: "Invalid or expired verification link." });
			}
			await users.markEmailVerificationTokenUsed(row.id);
			await users.markEmailVerified(row.userId);
		},

		/**
		 * Issues a fresh verification token for an unverified account. Returns
		 * null when the email is unknown, already verified, or a token was issued
		 * within the cooldown — the route answers identically in every case, so
		 * nothing leaks about the account.
		 */
		async requestEmailVerification(
			email: string,
		): Promise<{ user: AuthUser; token: string } | null> {
			const user = await users.getByEmail(email);
			if (!user || user.emailVerifiedAt !== null) return null;

			const lastIssuedAt = await users.getLatestEmailVerificationTokenTime(user.id);
			if (
				lastIssuedAt &&
				Date.now() - lastIssuedAt.getTime() < seconds(policy.resendCooldownSeconds)
			) {
				return null;
			}

			return {
				user: toAuthUser(user),
				token: await issueSingleUseToken(user.id, "email-verification"),
			};
		},

		/**
		 * Issues a password-reset token. Returns null when the email is unknown or
		 * a token was issued within the cooldown; the route answers identically
		 * either way, so it never reveals whether an account exists.
		 */
		async requestPasswordReset(email: string): Promise<{ user: AuthUser; token: string } | null> {
			const user = await users.getByEmail(email);
			if (!user) return null;

			const lastIssuedAt = await users.getLatestPasswordResetTokenTime(user.id);
			if (
				lastIssuedAt &&
				Date.now() - lastIssuedAt.getTime() < seconds(policy.resendCooldownSeconds)
			) {
				return null;
			}

			return {
				user: toAuthUser(user),
				token: await issueSingleUseToken(user.id, "password-reset"),
			};
		},

		/** Consumes the token, sets the new password, and signs every device out. */
		async confirmPasswordReset(token: string, password: string): Promise<void> {
			const row = await users.getPasswordResetTokenByHash(await sha256Hex(token));
			if (!row || row.usedAt || row.expiresAt.getTime() <= Date.now()) {
				throw new HTTPException(400, { message: "Invalid or expired reset link." });
			}
			await users.completePasswordReset({
				tokenId: row.id,
				userId: row.userId,
				passwordHash: await hashPassword(password),
			});
		},
	};
}

export type AuthService = ReturnType<typeof createAuthService>;
