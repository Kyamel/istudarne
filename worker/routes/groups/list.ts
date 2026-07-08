import type { HonoEnv } from "@api/env";
import { container, requireUser } from "@api/http/context";
import { authSecurity, errorResponse, jsonResponse } from "@api/openapi";
import { createRoute, type RouteHandler } from "@hono/zod-openapi";
import { groupListResponseSchema } from "@shared/contracts";

export const listGroupsRoute = createRoute({
	method: "get",
	path: "/api/groups",
	tags: ["Groups"],
	summary: "List study groups",
	security: authSecurity,
	responses: {
		200: jsonResponse(groupListResponseSchema, "Groups visible to the authenticated user."),
		401: errorResponse("Unauthenticated."),
	},
});

export const listGroupsHandler: RouteHandler<typeof listGroupsRoute, HonoEnv> = async (c) => {
	const user = requireUser(c);
	const groups = await container(c).services.group.list(user.id);
	return c.json({ groups }, 200);
};
