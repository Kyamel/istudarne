import type { HonoEnv } from "@api/env";
import { container, requireUser } from "@api/http/context";
import { authSecurity, errorResponse, jsonBody, jsonResponse } from "@api/openapi";
import { createRoute, type RouteHandler } from "@hono/zod-openapi";
import { createGroupRequestSchema, createGroupResponseSchema } from "@shared/contracts";

export const createGroupRoute = createRoute({
	method: "post",
	path: "/api/groups",
	tags: ["Groups"],
	summary: "Create a study group",
	security: authSecurity,
	request: {
		body: jsonBody(createGroupRequestSchema),
	},
	responses: {
		201: jsonResponse(createGroupResponseSchema, "Group created."),
		400: errorResponse("Invalid payload."),
		401: errorResponse("Unauthenticated."),
	},
});

export const createGroupHandler: RouteHandler<typeof createGroupRoute, HonoEnv> = async (c) => {
	const user = requireUser(c);
	const body = c.req.valid("json");
	const id = await container(c).services.group.create({
		ownerId: user.id,
		name: body.name,
		description: body.description ?? null,
		visibility: body.visibility,
	});
	return c.json({ id }, 201);
};
