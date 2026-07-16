import type { HonoEnv } from "@api/env";
import { container, currentUser } from "@api/http/context";
import { errorResponse, IdParamsSchema } from "@api/openapi";
import { createRoute, type RouteHandler, z } from "@hono/zod-openapi";
import { type QuizDetail, quizDetailResponseSchema } from "@istudarne/contracts";

/* Renders a quiz as self-contained Markdown, one section per question.
   This shape chunks cleanly for embeddings in RAG pipelines. */
function quizToMarkdown(quiz: QuizDetail): string {
	const header = [
		`# ${quiz.title}`,
		"",
		quiz.description ?? "",
		"",
		`- Author: ${quiz.ownerDisplayName} (@${quiz.ownerUsername})`,
		`- Questions: ${quiz.questionCount}`,
		quiz.tags.length ? `- Tags: ${quiz.tags.join(", ")}` : "",
		"",
	];

	const questions = quiz.questions.flatMap((question, index) => [
		`## Question ${index + 1}${question.topic ? ` — ${question.topic}` : ""}`,
		"",
		question.statement,
		"",
		...question.options.map((option) => `- ${option.key}) ${option.text}`),
		"",
		`**Answer:** ${question.answer}`,
		question.explanation ? `**Explanation:** ${question.explanation}` : "",
		"",
	]);

	return [...header, ...questions].filter((line) => line !== null).join("\n");
}

const ExportQuerySchema = z.object({
	format: z
		.enum(["json", "markdown"])
		.optional()
		.openapi({
			param: { name: "format", in: "query" },
			example: "markdown",
			description: "Export format; defaults to JSON.",
		}),
});

/* Machine-readable export of a quiz (including answers and explanations) for
   AI/RAG integrations. Authorization mirrors the detail route: public quizzes
   are open, private ones only for their owner. */
export const exportQuizRoute = createRoute({
	method: "get",
	path: "/api/quizzes/{id}/export",
	tags: ["Quizzes"],
	summary: "Export quiz for AI/RAG integrations",
	request: {
		params: IdParamsSchema,
		query: ExportQuerySchema,
	},
	responses: {
		200: {
			description: "The quiz as JSON or Markdown (one section per question).",
			content: {
				"application/json": { schema: quizDetailResponseSchema },
				"text/markdown": { schema: z.string() },
			},
		},
		404: errorResponse("Quiz not found or not visible to the viewer."),
	},
});

export const exportQuizHandler: RouteHandler<typeof exportQuizRoute, HonoEnv> = async (c) => {
	const { id } = c.req.valid("param");
	const viewer = currentUser(c);
	const quiz = await container(c).services.quiz.getForViewer(id, viewer?.id ?? null);

	if (c.req.valid("query").format === "markdown") {
		return c.text(quizToMarkdown(quiz), 200, {
			"Content-Type": "text/markdown; charset=utf-8",
		});
	}

	return c.json({ quiz }, 200);
};
