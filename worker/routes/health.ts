import type { App } from "../env";
import { healthRoute } from "../openapi";

export function registerHealth(app: App) {
	app.openapi(healthRoute, (c) =>
		c.json({ ok: true, app: "istudarne", runtime: "cloudflare-workers" }, 200),
	);
}
