import type { App } from "../../env";
import { container, requireUser } from "../../http/context";

export function registerJoinGroup(app: App) {
	app.post("/api/groups/:id/join", async (c) => {
		const user = requireUser(c);
		await container(c).services.group.join(c.req.param("id"), user.id);
		return c.json({ ok: true });
	});
}

export function registerLeaveGroup(app: App) {
	app.post("/api/groups/:id/leave", async (c) => {
		const user = requireUser(c);
		await container(c).services.group.leave(c.req.param("id"), user.id);
		return c.json({ ok: true });
	});
}
