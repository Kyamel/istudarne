import { z } from "zod";
import type { App } from "../../env";
import { container, requireUser } from "../../http/context";
import { readBody } from "../../http/validate";

const schema = z.object({ quizId: z.string().min(1) });

export function registerShareQuiz(app: App) {
	app.post("/api/groups/:id/quizzes", async (c) => {
		const user = requireUser(c);
		const body = await readBody(c, schema);
		await container(c).services.group.shareQuiz(c.req.param("id"), user.id, body.quizId);
		return c.json({ ok: true });
	});
}
