import type { HonoEnv } from "@api/env";
import { container, requireUser } from "@api/http/context";
import { authSecurity, errorResponse, IdParamsSchema, jsonResponse } from "@api/openapi";
import { createRoute, type RouteHandler } from "@hono/zod-openapi";
import { groupMessagesResponseSchema } from "@istudarne/contracts";

export const groupMessagesRoute = createRoute({
	method: "get",
	path: "/api/groups/{id}/messages",
	tags: ["Groups"],
	summary: "Recent chat messages",
	security: authSecurity,
	request: {
		params: IdParamsSchema,
	},
	responses: {
		200: jsonResponse(groupMessagesResponseSchema, "Latest chat messages of the group."),
		401: errorResponse("Unauthenticated."),
		403: errorResponse("Not a member of the group."),
	},
});

export const groupMessagesHandler: RouteHandler<typeof groupMessagesRoute, HonoEnv> = async (c) => {
	const user = requireUser(c);
	const { id } = c.req.valid("param");
	const messages = await container(c).services.group.messages(id, user.id);
	return c.json({ messages }, 200);
};
