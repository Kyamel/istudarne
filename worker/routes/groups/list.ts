import type { App } from "../../env";
import { container, requireUser } from "../../http/context";

export function registerListGroups(app: App) {
	app.get("/api/groups", async (c) => {
		const user = requireUser(c);
		const groups = await container(c).services.group.list(user.id);
		return c.json({ groups });
	});
}
