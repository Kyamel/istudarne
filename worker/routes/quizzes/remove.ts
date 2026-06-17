import type { App } from "../../env";
import { container, requireUser } from "../../http/context";

export function registerDeleteQuiz(app: App) {
	app.delete("/api/quizzes/:id", async (c) => {
		const user = requireUser(c);
		await container(c).services.quiz.remove(c.req.param("id"), user.id);
		return c.json({ ok: true });
	});
}
