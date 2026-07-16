import type { HonoEnv } from "@api/env";
import { container, requireUser } from "@api/http/context";
import { authSecurity, errorResponse, IdParamsSchema, jsonBody, jsonResponse } from "@api/openapi";
import { createRoute, type RouteHandler } from "@hono/zod-openapi";
import { patchQuizRequestSchema, quizSummaryResponseSchema } from "@istudarne/contracts";

export const patchQuizRoute = createRoute({
	method: "patch",
	path: "/api/quizzes/{id}",
	tags: ["Quizzes"],
	summary: "Update quiz metadata",
	security: authSecurity,
	request: {
		params: IdParamsSchema,
		body: jsonBody(patchQuizRequestSchema),
	},
	responses: {
		200: jsonResponse(quizSummaryResponseSchema, "Updated quiz."),
		400: errorResponse("Invalid payload."),
		401: errorResponse("Unauthenticated."),
		403: errorResponse("Only the owner can edit a quiz."),
		404: errorResponse("Quiz not found."),
	},
});

export const patchQuizHandler: RouteHandler<typeof patchQuizRoute, HonoEnv> = async (c) => {
	const user = requireUser(c);
	const { id } = c.req.valid("param");
	const patch = c.req.valid("json");
	const quiz = await container(c).services.quiz.update(id, user.id, patch);
	return c.json({ quiz }, 200);
};
