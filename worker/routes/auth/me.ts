import { createRoute, type RouteHandler } from "@hono/zod-openapi";
import { authUserResponseSchema } from "@shared/contracts";
import type { HonoEnv } from "@api/env";
import { requireUser } from "@api/http/context";
import { authSecurity, errorResponse, jsonResponse } from "@api/openapi";

export const meRoute = createRoute({
	method: "get",
	path: "/api/auth/me",
	tags: ["Auth"],
	summary: "Current user",
	security: authSecurity,
	responses: {
		200: jsonResponse(authUserResponseSchema, "The authenticated user."),
		401: errorResponse("Unauthenticated."),
	},
});

export const meHandler: RouteHandler<typeof meRoute, HonoEnv> = (c) =>
	c.json({ user: requireUser(c) }, 200);
