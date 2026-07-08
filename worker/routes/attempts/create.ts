import type { HonoEnv } from "@api/env";
import { container, requireUser } from "@api/http/context";
import { authSecurity, errorResponse, IdParamsSchema, jsonBody, jsonResponse } from "@api/openapi";
import { createRoute, type RouteHandler } from "@hono/zod-openapi";
import { startAttemptRequestSchema, startAttemptResponseSchema } from "@shared/contracts";

export const createAttemptRoute = createRoute({
	method: "post",
	path: "/api/quizzes/{id}/attempts",
	tags: ["Attempts"],
	summary: "Start a quiz attempt",
	security: authSecurity,
	request: {
		params: IdParamsSchema,
		body: jsonBody(startAttemptRequestSchema),
	},
	responses: {
		201: jsonResponse(startAttemptResponseSchema, "Attempt started."),
		401: errorResponse("Unauthenticated."),
		404: errorResponse("Quiz not found or not visible to the viewer."),
	},
});

export const createAttemptHandler: RouteHandler<typeof createAttemptRoute, HonoEnv> = async (c) => {
	const user = requireUser(c);
	const { id } = c.req.valid("param");
	const body = c.req.valid("json");
	const attemptId = await container(c).services.attempt.start(id, user.id, body.mode);
	return c.json({ attemptId }, 201);
};
