import type { App } from "../../env";
import { container, requireUser } from "../../http/context";

export function registerListMyQuizzes(app: App) {
	app.get("/api/me/quizzes", async (c) => {
		const user = requireUser(c);
		const quizzes = await container(c).services.quiz.listMine(user.id);
		return c.json({ quizzes });
	});
}
