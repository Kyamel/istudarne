import { z } from "zod";
import type { App } from "../../env";
import { container } from "../../http/context";
import { setSessionCookie } from "../../http/cookies";
import { readBody } from "../../http/validate";

const schema = z.object({
	email: z.string().email(),
	password: z.string().min(1),
});

export function registerLogin(app: App) {
	app.post("/api/auth/login", async (c) => {
		const body = await readBody(c, schema);
		const { user, token } = await container(c).services.auth.login(body.email, body.password);
		setSessionCookie(c, token);
		return c.json({ user });
	});
}
