import { index, pgTable, primaryKey, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { authUser } from "./auth";

/**
 * Domain profile, one row per authenticated user. Has its own id (the domain
 * key every other table joins against) plus `authUserId`, a unique FK to the
 * Better Auth user. Better Auth owns identity/credentials (email, password hash,
 * verification, sessions) in its own tables — see schema/auth.ts. A
 * `databaseHooks.user.create` in the API seeds a row here from the Better Auth
 * signup.
 */
export const users = pgTable(
	"users",
	{
		id: text("id").primaryKey(),
		authUserId: text("auth_user_id")
			.notNull()
			.references(() => authUser.id, { onDelete: "cascade" }),
		username: text("username").notNull().unique(),
		displayName: text("display_name").notNull(),
		bio: text("bio"),
		avatarUrl: text("avatar_url"),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		uniqueIndex("users_auth_user_id_idx").on(table.authUserId),
		index("users_username_idx").on(table.username),
	],
);

export const follows = pgTable(
	"follows",
	{
		followerId: text("follower_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		followingId: text("following_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [primaryKey({ columns: [table.followerId, table.followingId] })],
);
