import type { App } from "../../env";
import { container, requireUser } from "../../http/context";

export function registerFinishAttempt(app: App) {
	app.post("/api/attempts/:id/finish", async (c) => {
		const user = requireUser(c);
		const summary = await container(c).services.attempt.finish(c.req.param("id"), user.id);
		return c.json({ summary });
	});
}
