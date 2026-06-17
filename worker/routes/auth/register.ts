import { z } from "zod";
import type { App } from "../../env";
import { container } from "../../http/context";
import { setSessionCookie } from "../../http/cookies";
import { readBody } from "../../http/validate";

const schema = z.object({
	email: z.string().email(),
	username: z
		.string()
		.min(3)
		.max(24)
		.regex(/^[a-z0-9_]+$/i, "Use apenas letras, números ou _."),
	displayName: z.string().min(2).max(60),
	password: z.string().min(8).max(128),
});

export function registerRegister(app: App) {
	app.post("/api/auth/register", async (c) => {
		const body = await readBody(c, schema);
		const { user, token } = await container(c).services.auth.register(body);
		setSessionCookie(c, token);
		return c.json({ user }, 201);
	});
}
