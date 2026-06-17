import { submitAnswerRequestSchema } from "../../../app/lib/contracts";
import type { App } from "../../env";
import { container, requireUser } from "../../http/context";
import { readBody } from "../../http/validate";

export function registerAnswerAttempt(app: App) {
	app.post("/api/attempts/:id/answers", async (c) => {
		const user = requireUser(c);
		const body = await readBody(c, submitAnswerRequestSchema);
		const result = await container(c).services.attempt.answer(c.req.param("id"), user.id, body);
		return c.json(result);
	});
}
