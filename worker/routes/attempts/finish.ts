import type { HonoEnv } from "@api/env";
import { container, requireUser } from "@api/http/context";
import { authSecurity, errorResponse, IdParamsSchema, jsonResponse } from "@api/openapi";
import { createRoute, type RouteHandler } from "@hono/zod-openapi";
import { finishAttemptResponseSchema } from "@shared/contracts";

export const finishAttemptRoute = createRoute({
	method: "post",
	path: "/api/attempts/{id}/finish",
	tags: ["Attempts"],
	summary: "Finish an attempt",
	security: authSecurity,
	request: {
		params: IdParamsSchema,
	},
	responses: {
		200: jsonResponse(finishAttemptResponseSchema, "Attempt summary."),
		401: errorResponse("Unauthenticated."),
		404: errorResponse("Attempt not found."),
	},
});

export const finishAttemptHandler: RouteHandler<typeof finishAttemptRoute, HonoEnv> = async (c) => {
	const user = requireUser(c);
	const { id } = c.req.valid("param");
	const summary = await container(c).services.attempt.finish(id, user.id);
	return c.json({ summary }, 200);
};
