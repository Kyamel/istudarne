import type { App } from "../../env";
import { container, requireUser } from "../../http/context";

export function registerGroupMessages(app: App) {
	app.get("/api/groups/:id/messages", async (c) => {
		const user = requireUser(c);
		const messages = await container(c).services.group.messages(c.req.param("id"), user.id);
		return c.json({ messages });
	});
}
