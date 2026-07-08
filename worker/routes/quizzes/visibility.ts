import type { HonoEnv } from "@api/env";
import { container, requireUser } from "@api/http/context";
import { authSecurity, errorResponse, IdParamsSchema, jsonResponse } from "@api/openapi";
import { createRoute, type RouteHandler } from "@hono/zod-openapi";
import { quizSummaryResponseSchema } from "@shared/contracts";

const visibilityResponses = {
	200: jsonResponse(quizSummaryResponseSchema, "Updated quiz."),
	401: errorResponse("Unauthenticated."),
	403: errorResponse("Only the owner can change visibility."),
	404: errorResponse("Quiz not found."),
};

export const publishQuizRoute = createRoute({
	method: "post",
	path: "/api/quizzes/{id}/publish",
	tags: ["Quizzes"],
	summary: "Publish a quiz",
	security: authSecurity,
	request: { params: IdParamsSchema },
	responses: visibilityResponses,
});

export const publishQuizHandler: RouteHandler<typeof publishQuizRoute, HonoEnv> = async (c) => {
	const user = requireUser(c);
	const { id } = c.req.valid("param");
	const quiz = await container(c).services.quiz.setVisibility(id, user.id, "public");
	return c.json({ quiz }, 200);
};

export const unpublishQuizRoute = createRoute({
	method: "post",
	path: "/api/quizzes/{id}/unpublish",
	tags: ["Quizzes"],
	summary: "Unpublish a quiz (make it private)",
	security: authSecurity,
	request: { params: IdParamsSchema },
	responses: visibilityResponses,
});

export const unpublishQuizHandler: RouteHandler<typeof unpublishQuizRoute, HonoEnv> = async (c) => {
	const user = requireUser(c);
	const { id } = c.req.valid("param");
	const quiz = await container(c).services.quiz.setVisibility(id, user.id, "private");
	return c.json({ quiz }, 200);
};
