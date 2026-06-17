import type { App } from "../../env";
import { container, requireUser } from "../../http/context";

export function registerGroupDetail(app: App) {
	app.get("/api/groups/:id", async (c) => {
		const user = requireUser(c);
		const group = await container(c).services.group.detail(c.req.param("id"), user.id);
		return c.json({ group });
	});
}
