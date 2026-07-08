import type { HonoEnv } from "@api/env";
import { container, requireUser } from "@api/http/context";
import { authSecurity, errorResponse, IdParamsSchema, jsonBody, jsonResponse } from "@api/openapi";
import { createRoute, type RouteHandler } from "@hono/zod-openapi";
import { submitAnswerRequestSchema, submitAnswerResponseSchema } from "@shared/contracts";

export const answerAttemptRoute = createRoute({
	method: "post",
	path: "/api/attempts/{id}/answers",
	tags: ["Attempts"],
	summary: "Submit an answer",
	security: authSecurity,
	request: {
		params: IdParamsSchema,
		body: jsonBody(submitAnswerRequestSchema),
	},
	responses: {
		200: jsonResponse(submitAnswerResponseSchema, "Whether the answer is correct."),
		401: errorResponse("Unauthenticated."),
		404: errorResponse("Attempt or question not found."),
	},
});

export const answerAttemptHandler: RouteHandler<typeof answerAttemptRoute, HonoEnv> = async (c) => {
	const user = requireUser(c);
	const { id } = c.req.valid("param");
	const body = c.req.valid("json");
	const result = await container(c).services.attempt.answer(id, user.id, body);
	return c.json(result, 200);
};
