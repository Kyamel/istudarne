import type { App } from "../../env";
import { container, requireUser } from "../../http/context";

export function registerMyStats(app: App) {
	app.get("/api/me/stats", async (c) => {
		const user = requireUser(c);
		const stats = await container(c).repositories.stats.forUser(user.id);
		return c.json({ stats });
	});
}
