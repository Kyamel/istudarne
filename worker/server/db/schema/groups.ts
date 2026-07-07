import { sql } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { quizzes } from "./quizzes";
import { users } from "./users";

export const studyGroups = sqliteTable("study_groups", {
	id: text("id").primaryKey(),
	ownerId: text("owner_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	description: text("description"),
	visibility: text("visibility", { enum: ["public", "private", "invite"] })
		.notNull()
		.default("private"),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const studyGroupMembers = sqliteTable(
	"study_group_members",
	{
		groupId: text("group_id")
			.notNull()
			.references(() => studyGroups.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		role: text("role", { enum: ["owner", "moderator", "member"] }).notNull(),
		joinedAt: integer("joined_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
	},
	(table) => [primaryKey({ columns: [table.groupId, table.userId] })],
);

export const studyGroupQuizzes = sqliteTable(
	"study_group_quizzes",
	{
		groupId: text("group_id")
			.notNull()
			.references(() => studyGroups.id, { onDelete: "cascade" }),
		quizId: text("quiz_id")
			.notNull()
			.references(() => quizzes.id, { onDelete: "cascade" }),
		sharedBy: text("shared_by")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
	},
	(table) => [primaryKey({ columns: [table.groupId, table.quizId] })],
);

export const chatMessages = sqliteTable(
	"chat_messages",
	{
		id: text("id").primaryKey(),
		groupId: text("group_id")
			.notNull()
			.references(() => studyGroups.id, { onDelete: "cascade" }),
		senderId: text("sender_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		body: text("body").notNull(),
		createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
		editedAt: integer("edited_at", { mode: "timestamp" }),
		deletedAt: integer("deleted_at", { mode: "timestamp" }),
	},
	(table) => [index("chat_messages_group_idx").on(table.groupId)],
);
