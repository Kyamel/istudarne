import { z } from "zod";
import type { App } from "../../env";
import { container, requireUser } from "../../http/context";
import { readBody } from "../../http/validate";

const schema = z.object({
	title: z.string().min(1).max(160).optional(),
	description: z.string().max(1200).nullable().optional(),
	visibility: z.enum(["private", "public", "unlisted"]).optional(),
	tags: z.array(z.string().min(1).max(48)).max(12).optional(),
});

export function registerPatchQuiz(app: App) {
	app.patch("/api/quizzes/:id", async (c) => {
		const user = requireUser(c);
		const patch = await readBody(c, schema);
		const quiz = await container(c).services.quiz.update(c.req.param("id"), user.id, patch);
		return c.json({ quiz });
	});
}
