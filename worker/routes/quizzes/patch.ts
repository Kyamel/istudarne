import { patchQuizRequestSchema } from "@shared/contracts";
import type { App } from "../../env";
import { container, requireUser } from "../../http/context";
import { readBody } from "../../http/validate";

export function registerPatchQuiz(app: App) {
	app.patch("/api/quizzes/:id", async (c) => {
		const user = requireUser(c);
		const patch = await readBody(c, patchQuizRequestSchema);
		const quiz = await container(c).services.quiz.update(c.req.param("id"), user.id, patch);
		return c.json({ quiz });
	});
}
