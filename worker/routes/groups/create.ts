import { createGroupRequestSchema } from "../../../app/lib/contracts";
import type { App } from "../../env";
import { container, requireUser } from "../../http/context";
import { readBody } from "../../http/validate";

export function registerCreateGroup(app: App) {
	app.post("/api/groups", async (c) => {
		const user = requireUser(c);
		const body = await readBody(c, createGroupRequestSchema);
		const id = await container(c).services.group.create({
			ownerId: user.id,
			name: body.name,
			description: body.description ?? null,
			visibility: body.visibility,
		});
		return c.json({ id }, 201);
	});
}
