import type { HonoEnv } from "@api/env";
import { container, requireUser } from "@api/http/context";
import { authSecurity, errorResponse, IdParamsSchema, jsonResponse } from "@api/openapi";
import { createRoute, type RouteHandler } from "@hono/zod-openapi";
import { okResponseSchema } from "@istudarne/contracts";

const membershipResponses = {
	200: jsonResponse(okResponseSchema, "Done."),
	401: errorResponse("Unauthenticated."),
	404: errorResponse("Group not found."),
};

export const joinGroupRoute = createRoute({
	method: "post",
	path: "/api/groups/{id}/join",
	tags: ["Groups"],
	summary: "Join a group",
	security: authSecurity,
	request: { params: IdParamsSchema },
	responses: membershipResponses,
});

export const joinGroupHandler: RouteHandler<typeof joinGroupRoute, HonoEnv> = async (c) => {
	const user = requireUser(c);
	const { id } = c.req.valid("param");
	await container(c).services.group.join(id, user.id);
	return c.json({ ok: true as const }, 200);
};

export const leaveGroupRoute = createRoute({
	method: "post",
	path: "/api/groups/{id}/leave",
	tags: ["Groups"],
	summary: "Leave a group",
	security: authSecurity,
	request: { params: IdParamsSchema },
	responses: membershipResponses,
});

export const leaveGroupHandler: RouteHandler<typeof leaveGroupRoute, HonoEnv> = async (c) => {
	const user = requireUser(c);
	const { id } = c.req.valid("param");
	await container(c).services.group.leave(id, user.id);
	return c.json({ ok: true as const }, 200);
};
