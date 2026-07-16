import { bigint, boolean, index, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

/**
 * Better Auth persistence (see `@istudarne/auth`). These five tables are the
 * Better Auth Drizzle adapter's required models: `user`, `session`, `account`
 * (holds the password hash / OAuth tokens), `verification` (email/reset links),
 * and `rate_limit`. The domain profile (username, displayName, bio, avatar)
 * lives in `users`, keyed by the same id — see schema/users.ts.
 */

export const authUser = pgTable(
	"user",
	{
		id: text("id").primaryKey(),
		name: text("name").notNull(),
		email: text("email").notNull(),
		emailVerified: boolean("email_verified").default(false).notNull(),
		image: text("image"),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [uniqueIndex("auth_user_email_idx").on(table.email)],
);

export const authSession = pgTable(
	"session",
	{
		id: text("id").primaryKey(),
		expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
		token: text("token").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		userId: text("user_id")
			.notNull()
			.references(() => authUser.id, { onDelete: "cascade" }),
	},
	(table) => [
		uniqueIndex("auth_session_token_idx").on(table.token),
		index("auth_session_user_id_idx").on(table.userId),
	],
);

export const authAccount = pgTable(
	"account",
	{
		id: text("id").primaryKey(),
		accountId: text("account_id").notNull(),
		providerId: text("provider_id").notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => authUser.id, { onDelete: "cascade" }),
		accessToken: text("access_token"),
		refreshToken: text("refresh_token"),
		idToken: text("id_token"),
		accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
		refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
		scope: text("scope"),
		password: text("password"),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("auth_account_user_id_idx").on(table.userId),
		uniqueIndex("auth_account_provider_account_idx").on(table.providerId, table.accountId),
	],
);

export const authVerification = pgTable(
	"verification",
	{
		id: text("id").primaryKey(),
		identifier: text("identifier").notNull(),
		value: text("value").notNull(),
		expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [index("auth_verification_identifier_idx").on(table.identifier)],
);

// Better Auth's Drizzle adapter requires an `id` primary key on every model;
// `key` is the lookup column (unique). `last_request` holds `Date.now()` (ms),
// which overflows int4 — it must be a bigint.
export const authRateLimit = pgTable(
	"rate_limit",
	{
		id: text("id").primaryKey(),
		key: text("key"),
		count: integer("count").default(0).notNull(),
		lastRequest: bigint("last_request", { mode: "number" }).notNull(),
	},
	(table) => [uniqueIndex("auth_rate_limit_key_idx").on(table.key)],
);
