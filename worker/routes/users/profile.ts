import type { App } from "../../env";
import { container, currentUser } from "../../http/context";

export function registerProfile(app: App) {
	app.get("/api/users/:username", async (c) => {
		const viewer = currentUser(c);
		const profile = await container(c).services.profile.get(
			c.req.param("username"),
			viewer?.id ?? null,
		);
		return c.json({ profile });
	});
}
