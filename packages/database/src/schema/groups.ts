import { index, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { quizzes } from "./quizzes";
import { users } from "./users";

export const studyGroups = pgTable("study_groups", {
	id: text("id").primaryKey(),
	ownerId: text("owner_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	description: text("description"),
	visibility: text("visibility", { enum: ["public", "private", "invite"] })
		.notNull()
		.default("private"),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const studyGroupMembers = pgTable(
	"study_group_members",
	{
		groupId: text("group_id")
			.notNull()
			.references(() => studyGroups.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		role: text("role", { enum: ["owner", "moderator", "member"] }).notNull(),
		joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [primaryKey({ columns: [table.groupId, table.userId] })],
);

export const studyGroupQuizzes = pgTable(
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
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [primaryKey({ columns: [table.groupId, table.quizId] })],
);

export const chatMessages = pgTable(
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
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		editedAt: timestamp("edited_at", { withTimezone: true }),
		deletedAt: timestamp("deleted_at", { withTimezone: true }),
	},
	(table) => [index("chat_messages_group_idx").on(table.groupId)],
);
