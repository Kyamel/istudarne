import type { QuizDetail } from "@shared/contracts";
import type { App } from "../../env";
import { container, currentUser } from "../../http/context";

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

/* GET /api/quizzes/:id/export?format=json|markdown
   Machine-readable export of a quiz (including answers and explanations) for
   AI/RAG integrations. Authorization mirrors the detail route: public quizzes
   are open, private ones only for their owner. */
export function registerExportQuiz(app: App) {
	app.get("/api/quizzes/:id/export", async (c) => {
		const viewer = currentUser(c);
		const quiz = await container(c).services.quiz.getForViewer(
			c.req.param("id"),
			viewer?.id ?? null,
		);

		if (c.req.query("format") === "markdown") {
			return c.text(quizToMarkdown(quiz), 200, {
				"Content-Type": "text/markdown; charset=utf-8",
			});
		}

		return c.json({ quiz });
	});
}
