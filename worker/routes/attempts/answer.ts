import { z } from "zod";
import type { App } from "../../env";
import { container, requireUser } from "../../http/context";
import { readBody } from "../../http/validate";

const schema = z.object({
	questionId: z.string().min(1),
	selectedOption: z.string().min(1),
	timeSpentMs: z.number().int().nonnegative().optional(),
});

export function registerAnswerAttempt(app: App) {
	app.post("/api/attempts/:id/answers", async (c) => {
		const user = requireUser(c);
		const body = await readBody(c, schema);
		const result = await container(c).services.attempt.answer(c.req.param("id"), user.id, body);
		return c.json(result);
	});
}
