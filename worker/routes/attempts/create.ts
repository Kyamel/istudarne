import { z } from "zod";
import type { App } from "../../env";
import { container, requireUser } from "../../http/context";
import { readBody } from "../../http/validate";

const schema = z.object({
	mode: z.enum(["practice", "exam", "review"]).default("practice"),
});

export function registerCreateAttempt(app: App) {
	app.post("/api/quizzes/:id/attempts", async (c) => {
		const user = requireUser(c);
		const body = await readBody(c, schema);
		const attemptId = await container(c).services.attempt.start(
			c.req.param("id"),
			user.id,
			body.mode,
		);
		return c.json({ attemptId }, 201);
	});
}
