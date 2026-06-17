import type { App } from "../../env";
import { container } from "../../http/context";
import { searchQuizzesRoute } from "../../openapi";

export function registerSearchQuizzes(app: App) {
	app.openapi(searchQuizzesRoute, async (c) => {
		const query = c.req.valid("query").q?.trim() ?? "";
		const quizzes = await container(c).services.quiz.search(query);
		return c.json({ quizzes }, 200);
	});
}
