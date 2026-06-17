import type { App } from "../../env";
import { container, requireUser } from "../../http/context";

export function registerPublishQuiz(app: App) {
	app.post("/api/quizzes/:id/publish", async (c) => {
		const user = requireUser(c);
		const quiz = await container(c).services.quiz.setVisibility(
			c.req.param("id"),
			user.id,
			"public",
		);
		return c.json({ quiz });
	});
}

export function registerUnpublishQuiz(app: App) {
	app.post("/api/quizzes/:id/unpublish", async (c) => {
		const user = requireUser(c);
		const quiz = await container(c).services.quiz.setVisibility(
			c.req.param("id"),
			user.id,
			"private",
		);
		return c.json({ quiz });
	});
}
