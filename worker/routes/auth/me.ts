import type { App } from "../../env";
import { requireUser } from "../../http/context";

export function registerMe(app: App) {
	app.get("/api/auth/me", (c) => c.json({ user: requireUser(c) }));
}
