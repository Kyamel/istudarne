import type { App } from "../../env";
import { container, requireUser } from "../../http/context";

export function registerFollow(app: App) {
	app.post("/api/users/:username/follow", async (c) => {
		const user = requireUser(c);
		await container(c).services.profile.follow(user.id, c.req.param("username"));
		return c.json({ ok: true });
	});
}

export function registerUnfollow(app: App) {
	app.delete("/api/users/:username/follow", async (c) => {
		const user = requireUser(c);
		await container(c).services.profile.unfollow(user.id, c.req.param("username"));
		return c.json({ ok: true });
	});
}
