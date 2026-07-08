import { createRoute, type RouteHandler } from "@hono/zod-openapi";
import { okResponseSchema } from "@shared/contracts";
import type { HonoEnv } from "@api/env";
import { container, requireUser } from "@api/http/context";
import { authSecurity, errorResponse, IdParamsSchema, jsonResponse } from "@api/openapi";

export const deleteQuizRoute = createRoute({
	method: "delete",
	path: "/api/quizzes/{id}",
	tags: ["Quizzes"],
	summary: "Delete a quiz",
	security: authSecurity,
	request: {
		params: IdParamsSchema,
	},
	responses: {
		200: jsonResponse(okResponseSchema, "Quiz deleted."),
		401: errorResponse("Unauthenticated."),
		403: errorResponse("Only the owner can delete a quiz."),
		404: errorResponse("Quiz not found."),
	},
});

export const deleteQuizHandler: RouteHandler<typeof deleteQuizRoute, HonoEnv> = async (c) => {
	const user = requireUser(c);
	const { id } = c.req.valid("param");
	await container(c).services.quiz.remove(id, user.id);
	return c.json({ ok: true as const }, 200);
};
