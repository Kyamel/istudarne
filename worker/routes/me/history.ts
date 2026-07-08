import { createRoute, type RouteHandler } from "@hono/zod-openapi";
import { historyResponseSchema } from "@shared/contracts";
import type { HonoEnv } from "@api/env";
import { container, requireUser } from "@api/http/context";
import { authSecurity, errorResponse, jsonResponse } from "@api/openapi";

export const myHistoryRoute = createRoute({
	method: "get",
	path: "/api/me/history",
	tags: ["Me"],
	summary: "My attempt history",
	security: authSecurity,
	responses: {
		200: jsonResponse(historyResponseSchema, "Recent attempts of the authenticated user."),
		401: errorResponse("Unauthenticated."),
	},
});

export const myHistoryHandler: RouteHandler<typeof myHistoryRoute, HonoEnv> = async (c) => {
	const user = requireUser(c);
	const history = await container(c).repositories.stats.historyForUser(user.id);
	return c.json({ history }, 200);
};
