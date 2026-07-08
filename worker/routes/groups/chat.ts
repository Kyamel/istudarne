import { createRoute, type RouteHandler, z } from "@hono/zod-openapi";
import { forbidden, unauthorized } from "@api/server/errors";
import type { HonoEnv } from "@api/env";
import { container, currentUser } from "@api/http/context";
import { authSecurity, GroupIdParamsSchema } from "@api/openapi";

export const groupChatRoute = createRoute({
	method: "get",
	path: "/api/groups/{groupId}/chat",
	tags: ["Groups"],
	summary: "Connect to the group chat",
	description:
		"WebSocket endpoint forwarded to the group's Durable Object. Use the Upgrade: websocket header.",
	security: authSecurity,
	request: {
		params: GroupIdParamsSchema,
	},
	responses: {
		101: {
			description: "WebSocket connection established.",
		},
		426: {
			description: "The route expects a WebSocket upgrade.",
			content: {
				"text/plain": {
					schema: z.string().openapi({ example: "Expected WebSocket" }),
				},
			},
		},
	},
});

export const groupChatHandler: RouteHandler<typeof groupChatRoute, HonoEnv> = async (c) => {
	const { groupId } = c.req.valid("param");
	const user = currentUser(c);
	if (!user) throw unauthorized("Please sign in to join the chat.");

	const role = await container(c).services.group.membership(groupId, user.id);
	if (!role) throw forbidden("You are not a member of this group.");

	const url = new URL(c.req.url);
	url.searchParams.set("uid", user.id);
	url.searchParams.set("name", user.displayName);
	const id = c.env.STUDY_GROUP_CHAT.idFromName(groupId);
	const object = c.env.STUDY_GROUP_CHAT.get(id);
	return object.fetch(new Request(url, c.req.raw));
};
