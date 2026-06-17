import { sql } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { users } from "./users";

export const quizzes = sqliteTable(
	"quizzes",
	{
		id: text("id").primaryKey(),
		ownerId: text("owner_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		title: text("title").notNull(),
		description: text("description"),
		visibility: text("visibility", {
			enum: ["private", "public", "unlisted"],
		})
			.notNull()
			.default("private"),
		sourceFileKey: text("source_file_key"),
		questionCount: integer("question_count").notNull().default(0),
		playsCount: integer("plays_count").notNull().default(0),
		createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
		updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
		publishedAt: integer("published_at", { mode: "timestamp" }),
	},
	(table) => ({
		ownerIdx: index("quizzes_owner_idx").on(table.ownerId),
		visibilityIdx: index("quizzes_visibility_idx").on(table.visibility),
		titleIdx: index("quizzes_title_idx").on(table.title),
	}),
);

export const questions = sqliteTable(
	"questions",
	{
		id: text("id").primaryKey(),
		quizId: text("quiz_id")
			.notNull()
			.references(() => quizzes.id, { onDelete: "cascade" }),
		externalId: text("external_id"),
		topic: text("topic"),
		statement: text("statement").notNull(),
		answer: text("answer").notNull(),
		explanation: text("explanation"),
		position: integer("position").notNull(),
	},
	(table) => ({
		quizIdx: index("questions_quiz_idx").on(table.quizId),
	}),
);

export const questionOptions = sqliteTable(
	"question_options",
	{
		id: text("id").primaryKey(),
		questionId: text("question_id")
			.notNull()
			.references(() => questions.id, { onDelete: "cascade" }),
		optionKey: text("option_key").notNull(),
		text: text("text").notNull(),
		position: integer("position").notNull(),
	},
	(table) => ({
		questionIdx: index("question_options_question_idx").on(table.questionId),
	}),
);

export const tags = sqliteTable("tags", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	slug: text("slug").notNull().unique(),
});

export const quizTags = sqliteTable(
	"quiz_tags",
	{
		quizId: text("quiz_id")
			.notNull()
			.references(() => quizzes.id, { onDelete: "cascade" }),
		tagId: text("tag_id")
			.notNull()
			.references(() => tags.id, { onDelete: "cascade" }),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.quizId, table.tagId] }),
	}),
);
