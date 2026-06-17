import type { App } from "../../env";
import { container, currentUser } from "../../http/context";
import { groupChatRoute } from "../../openapi";

export function registerGroupChat(app: App) {
	app.openapi(groupChatRoute, async (c) => {
		const { groupId } = c.req.valid("param");
		const user = currentUser(c);
		if (!user) return c.text("Please sign in to join the chat.", 401);

		const role = await container(c).services.group.membership(groupId, user.id);
		if (!role) return c.text("You are not a member of this group.", 403);

		const url = new URL(c.req.url);
		url.searchParams.set("uid", user.id);
		url.searchParams.set("name", user.displayName);
		const id = c.env.STUDY_GROUP_CHAT.idFromName(groupId);
		const object = c.env.STUDY_GROUP_CHAT.get(id);
		return object.fetch(new Request(url, c.req.raw));
	});
}
