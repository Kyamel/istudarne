import type { App } from "../../env";
import { container, requireUser } from "../../http/context";

export function registerMyHistory(app: App) {
	app.get("/api/me/history", async (c) => {
		const user = requireUser(c);
		const history = await container(c).repositories.stats.historyForUser(user.id);
		return c.json({ history });
	});
}
