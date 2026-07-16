import { index, integer, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const quizzes = pgTable(
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
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
		publishedAt: timestamp("published_at", { withTimezone: true }),
	},
	(table) => [
		index("quizzes_owner_idx").on(table.ownerId),
		index("quizzes_visibility_idx").on(table.visibility),
		index("quizzes_title_idx").on(table.title),
	],
);

export const questions = pgTable(
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
	(table) => [index("questions_quiz_idx").on(table.quizId)],
);

export const questionOptions = pgTable(
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
	(table) => [index("question_options_question_idx").on(table.questionId)],
);

export const tags = pgTable("tags", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	slug: text("slug").notNull().unique(),
});

export const quizTags = pgTable(
	"quiz_tags",
	{
		quizId: text("quiz_id")
			.notNull()
			.references(() => quizzes.id, { onDelete: "cascade" }),
		tagId: text("tag_id")
			.notNull()
			.references(() => tags.id, { onDelete: "cascade" }),
	},
	(table) => [primaryKey({ columns: [table.quizId, table.tagId] })],
);
