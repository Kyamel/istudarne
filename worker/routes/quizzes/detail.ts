import type { App } from "../../env";
import { container, currentUser } from "../../http/context";

export function registerQuizDetail(app: App) {
	app.get("/api/quizzes/:id", async (c) => {
		const viewer = currentUser(c);
		const quiz = await container(c).services.quiz.getForViewer(
			c.req.param("id"),
			viewer?.id ?? null,
		);
		return c.json({ quiz });
	});
}
