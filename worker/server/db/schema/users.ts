import { sql } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
	"users",
	{
		id: text("id").primaryKey(),
		email: text("email").notNull().unique(),
		passwordHash: text("password_hash").notNull(),
		username: text("username").notNull().unique(),
		displayName: text("display_name").notNull(),
		bio: text("bio"),
		avatarUrl: text("avatar_url"),
		emailVerifiedAt: integer("email_verified_at", { mode: "timestamp" }),
		// Reserved for the future "Sign in with Google" flow (OAuth2 / OIDC).
		googleId: text("google_id").unique(),
		createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
		updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
	},
	(table) => [index("users_username_idx").on(table.username)],
);

/**
 * Long-lived refresh tokens (stored hashed). Access tokens are stateless JWTs;
 * refresh tokens are rotated on every use, and `revokedAt`/`replacedById`
 * allow detecting reuse of an already-rotated token.
 */
export const refreshTokens = sqliteTable(
	"refresh_tokens",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		tokenHash: text("token_hash").notNull().unique(),
		expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
		revokedAt: integer("revoked_at", { mode: "timestamp" }),
		replacedById: text("replaced_by_id"),
		createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
	},
	(table) => [
		index("refresh_tokens_user_idx").on(table.userId),
		index("refresh_tokens_token_idx").on(table.tokenHash),
	],
);

export const emailVerificationTokens = sqliteTable(
	"email_verification_tokens",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		tokenHash: text("token_hash").notNull().unique(),
		expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
		usedAt: integer("used_at", { mode: "timestamp" }),
		createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
	},
	(table) => [index("email_verification_tokens_user_idx").on(table.userId)],
);

/**
 * Single-use password-reset tokens (stored hashed). Consuming one sets the new
 * password and revokes every refresh token, so a leaked reset link cannot keep
 * a stolen session alive.
 */
export const passwordResetTokens = sqliteTable(
	"password_reset_tokens",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		tokenHash: text("token_hash").notNull().unique(),
		expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
		usedAt: integer("used_at", { mode: "timestamp" }),
		createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
	},
	(table) => [index("password_reset_tokens_user_idx").on(table.userId)],
);

export const follows = sqliteTable(
	"follows",
	{
		followerId: text("follower_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		followingId: text("following_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
	},
	(table) => [primaryKey({ columns: [table.followerId, table.followingId] })],
);
