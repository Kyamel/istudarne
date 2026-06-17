import { z } from "zod";
import type { App } from "../../env";
import { container, requireUser } from "../../http/context";
import { readBody } from "../../http/validate";

const schema = z.object({
	name: z.string().min(2).max(80),
	description: z.string().max(600).nullable().optional(),
	visibility: z.enum(["public", "private", "invite"]).default("public"),
});

export function registerCreateGroup(app: App) {
	app.post("/api/groups", async (c) => {
		const user = requireUser(c);
		const body = await readBody(c, schema);
		const id = await container(c).services.group.create({
			ownerId: user.id,
			name: body.name,
			description: body.description ?? null,
			visibility: body.visibility,
		});
		return c.json({ id }, 201);
	});
}
