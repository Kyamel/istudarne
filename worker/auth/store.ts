/**
 * Auth module — storage seam.
 *
 * The service never touches a database directly: the host app implements this
 * interface over its own schema/ORM (Drizzle + D1 here, anything elsewhere).
 * Implementing `AuthStore` is the only persistence work needed to port the
 * module to another project.
 */
import type { AuthUser } from "./contracts";

/** Row shape needed to check credentials (never leaves the service). */
export type CredentialsRecord = {
	id: string;
	email: string;
	username: string;
	displayName: string;
	bio: string | null;
	avatarUrl: string | null;
	passwordHash: string;
	emailVerifiedAt: Date | null;
};

export type CreateUserInput = {
	email: string;
	username: string;
	displayName: string;
	passwordHash: string;
};

export type RefreshTokenRecord = {
	id: string;
	userId: string;
	expiresAt: Date;
	revokedAt: Date | null;
	/** Set when this token was rotated, pointing at its successor. */
	replacedById: string | null;
};

export type CreateRefreshTokenInput = {
	id: string;
	userId: string;
	tokenHash: string;
	expiresAt: Date;
};

/** Shared shape for the single-use email-verification and password-reset tokens. */
export type SingleUseTokenRecord = {
	id: string;
	userId: string;
	expiresAt: Date;
	usedAt: Date | null;
};

export type EmailVerificationRecord = SingleUseTokenRecord;
export type PasswordResetRecord = SingleUseTokenRecord;

export type CreateSingleUseTokenInput = {
	id: string;
	userId: string;
	tokenHash: string;
	expiresAt: Date;
};

export type CreateEmailVerificationTokenInput = CreateSingleUseTokenInput;
export type CreatePasswordResetTokenInput = CreateSingleUseTokenInput;

export interface AuthStore {
	getByEmail(email: string): Promise<CredentialsRecord | null>;
	getByUsername(username: string): Promise<object | null>;
	getById(id: string): Promise<AuthUser | null>;
	create(input: CreateUserInput): Promise<{ id: string }>;

	createRefreshToken(input: CreateRefreshTokenInput): Promise<void>;
	getRefreshTokenByHash(tokenHash: string): Promise<RefreshTokenRecord | null>;
	/** Follows a rotation chain (`replacedById`) during the reuse-leeway window. */
	getRefreshTokenById(id: string): Promise<RefreshTokenRecord | null>;
	revokeRefreshToken(id: string, replacedById?: string | null): Promise<void>;
	revokeAllRefreshTokens(userId: string): Promise<void>;

	createEmailVerificationToken(input: CreateEmailVerificationTokenInput): Promise<void>;
	getEmailVerificationTokenByHash(tokenHash: string): Promise<EmailVerificationRecord | null>;
	markEmailVerificationTokenUsed(id: string): Promise<void>;
	markEmailVerified(userId: string): Promise<void>;
	getLatestEmailVerificationTokenTime(userId: string): Promise<Date | null>;

	createPasswordResetToken(input: CreatePasswordResetTokenInput): Promise<void>;
	getPasswordResetTokenByHash(tokenHash: string): Promise<PasswordResetRecord | null>;
	getLatestPasswordResetTokenTime(userId: string): Promise<Date | null>;
	/** Consume the token, set the new password, and drop every session, atomically. */
	completePasswordReset(input: {
		tokenId: string;
		userId: string;
		passwordHash: string;
	}): Promise<void>;
}
