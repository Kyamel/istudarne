import type { HonoEnv } from "@api/env";
import { container, requireUser } from "@api/http/context";
import { authSecurity, errorResponse, IdParamsSchema, jsonResponse } from "@api/openapi";
import { createRoute, type RouteHandler } from "@hono/zod-openapi";
import { groupDetailResponseSchema } from "@shared/contracts";

export const groupDetailRoute = createRoute({
	method: "get",
	path: "/api/groups/{id}",
	tags: ["Groups"],
	summary: "Group detail with members and shared quizzes",
	security: authSecurity,
	request: {
		params: IdParamsSchema,
	},
	responses: {
		200: jsonResponse(groupDetailResponseSchema, "The group."),
		401: errorResponse("Unauthenticated."),
		404: errorResponse("Group not found."),
	},
});

export const groupDetailHandler: RouteHandler<typeof groupDetailRoute, HonoEnv> = async (c) => {
	const user = requireUser(c);
	const { id } = c.req.valid("param");
	const group = await container(c).services.group.detail(id, user.id);
	return c.json({ group }, 200);
};
