import { z } from "zod";

export const quizOptionSchema = z.object({
	id: z.string().min(1).max(12),
	text: z.string().min(1),
});

export const quizQuestionSchema = z.object({
	id: z.union([z.string(), z.number()]).optional(),
	topic: z.string().optional(),
	statement: z.string().min(1),
	options: z.array(quizOptionSchema).min(2),
	answer: z.string().min(1),
	explanation: z.string().optional(),
});

export const uploadedQuizSchema = z.object({
	title: z.string().min(1).max(160),
	description: z.string().max(1200).optional(),
	tags: z.array(z.string().min(1).max(48)).max(12).optional(),
	questions: z.array(quizQuestionSchema).min(1).max(500),
});

export type UploadedQuiz = z.infer<typeof uploadedQuizSchema>;

export function parseUploadedQuiz(value: unknown) {
	const quiz = uploadedQuizSchema.parse(value);

	for (const [index, question] of quiz.questions.entries()) {
		const optionIds = new Set(question.options.map((option) => option.id));
		if (!optionIds.has(question.answer)) {
			throw new Error(`Questão ${index + 1}: a resposta correta precisa existir nas alternativas.`);
		}
	}

	return quiz;
}
