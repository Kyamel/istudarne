import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { questions, quizzes } from "./quizzes";
import { users } from "./users";

export const quizAttempts = sqliteTable(
	"quiz_attempts",
	{
		id: text("id").primaryKey(),
		quizId: text("quiz_id")
			.notNull()
			.references(() => quizzes.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		mode: text("mode", { enum: ["practice", "exam", "review"] }).notNull(),
		status: text("status", { enum: ["in_progress", "finished"] }).notNull(),
		score: integer("score").notNull().default(0),
		correctCount: integer("correct_count").notNull().default(0),
		wrongCount: integer("wrong_count").notNull().default(0),
		startedAt: integer("started_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
		finishedAt: integer("finished_at", { mode: "timestamp" }),
	},
	(table) => [
		index("quiz_attempts_user_idx").on(table.userId),
		index("quiz_attempts_quiz_idx").on(table.quizId),
	],
);

export const questionAnswers = sqliteTable(
	"question_answers",
	{
		id: text("id").primaryKey(),
		attemptId: text("attempt_id")
			.notNull()
			.references(() => quizAttempts.id, { onDelete: "cascade" }),
		questionId: text("question_id")
			.notNull()
			.references(() => questions.id, { onDelete: "cascade" }),
		selectedOption: text("selected_option").notNull(),
		isCorrect: integer("is_correct", { mode: "boolean" }).notNull(),
		answeredAt: integer("answered_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
		timeSpentMs: integer("time_spent_ms"),
	},
	(table) => [index("question_answers_attempt_idx").on(table.attemptId)],
);
