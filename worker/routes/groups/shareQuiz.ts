import { shareQuizRequestSchema } from "@shared/contracts";
import type { App } from "../../env";
import { container, requireUser } from "../../http/context";
import { readBody } from "../../http/validate";

export function registerShareQuiz(app: App) {
	app.post("/api/groups/:id/quizzes", async (c) => {
		const user = requireUser(c);
		const body = await readBody(c, shareQuizRequestSchema);
		await container(c).services.group.shareQuiz(c.req.param("id"), user.id, body.quizId);
		return c.json({ ok: true });
	});
}
