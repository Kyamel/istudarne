import { registerRequestSchema } from "@shared/contracts";
import type { App } from "../../env";
import { container } from "../../http/context";
import { setSessionCookie } from "../../http/cookies";
import { readBody } from "../../http/validate";

export function registerRegister(app: App) {
	app.post("/api/auth/register", async (c) => {
		const body = await readBody(c, registerRequestSchema);
		const { user, token } = await container(c).services.auth.register(body);
		setSessionCookie(c, token);
		return c.json({ user }, 201);
	});
}
