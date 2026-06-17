import type { App } from "../../env";
import { container } from "../../http/context";
import { clearSessionCookie, getSessionToken } from "../../http/cookies";

export function registerLogout(app: App) {
	app.post("/api/auth/logout", async (c) => {
		const token = getSessionToken(c);
		if (token) await container(c).services.auth.endSession(token);
		clearSessionCookie(c);
		return c.json({ ok: true });
	});
}
