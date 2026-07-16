import type { HonoEnv } from "@api/env";
import { container, requireUser } from "@api/http/context";
import { authSecurity, errorResponse, jsonResponse } from "@api/openapi";
import { createRoute, type RouteHandler } from "@hono/zod-openapi";
import { statsResponseSchema } from "@istudarne/contracts";

export const myStatsRoute = createRoute({
	method: "get",
	path: "/api/me/stats",
	tags: ["Me"],
	summary: "My study stats",
	security: authSecurity,
	responses: {
		200: jsonResponse(statsResponseSchema, "Aggregated stats for the authenticated user."),
		401: errorResponse("Unauthenticated."),
	},
});

export const myStatsHandler: RouteHandler<typeof myStatsRoute, HonoEnv> = async (c) => {
	const user = requireUser(c);
	const stats = await container(c).repositories.stats.forUser(user.id);
	return c.json({ stats }, 200);
};
