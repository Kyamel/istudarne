import { boolean, index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { questions, quizzes } from "./quizzes";
import { users } from "./users";

export const quizAttempts = pgTable(
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
		startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
		finishedAt: timestamp("finished_at", { withTimezone: true }),
	},
	(table) => [
		index("quiz_attempts_user_idx").on(table.userId),
		index("quiz_attempts_quiz_idx").on(table.quizId),
	],
);

export const questionAnswers = pgTable(
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
		isCorrect: boolean("is_correct").notNull(),
		answeredAt: timestamp("answered_at", { withTimezone: true }).notNull().defaultNow(),
		timeSpentMs: integer("time_spent_ms"),
	},
	(table) => [index("question_answers_attempt_idx").on(table.attemptId)],
);
