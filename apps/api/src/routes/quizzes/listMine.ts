import type { HonoEnv } from "@api/env";
import { container, requireUser } from "@api/http/context";
import { authSecurity, errorResponse, jsonResponse } from "@api/openapi";
import { createRoute, type RouteHandler } from "@hono/zod-openapi";
import { quizListResponseSchema } from "@istudarne/contracts";

export const listMyQuizzesRoute = createRoute({
	method: "get",
	path: "/api/me/quizzes",
	tags: ["Quizzes"],
	summary: "List my quizzes",
	security: authSecurity,
	responses: {
		200: jsonResponse(quizListResponseSchema, "Quizzes owned by the authenticated user."),
		401: errorResponse("Unauthenticated."),
	},
});

export const listMyQuizzesHandler: RouteHandler<typeof listMyQuizzesRoute, HonoEnv> = async (c) => {
	const user = requireUser(c);
	const quizzes = await container(c).services.quiz.listMine(user.id);
	return c.json({ quizzes }, 200);
};
