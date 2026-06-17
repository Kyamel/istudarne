import { relations } from "drizzle-orm";
import { quizAttempts } from "./attempts";
import { questionOptions, questions, quizzes } from "./quizzes";
import { users } from "./users";

export const usersRelations = relations(users, ({ many }) => ({
	quizzes: many(quizzes),
	attempts: many(quizAttempts),
}));

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
	owner: one(users, {
		fields: [quizzes.ownerId],
		references: [users.id],
	}),
	questions: many(questions),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
	quiz: one(quizzes, {
		fields: [questions.quizId],
		references: [quizzes.id],
	}),
	options: many(questionOptions),
}));
