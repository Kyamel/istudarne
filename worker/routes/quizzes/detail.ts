import type { HonoEnv } from "@api/env";
import { container, currentUser } from "@api/http/context";
import { errorResponse, IdParamsSchema, jsonResponse } from "@api/openapi";
import { createRoute, type RouteHandler } from "@hono/zod-openapi";
import { quizDetailResponseSchema } from "@shared/contracts";

export const quizDetailRoute = createRoute({
	method: "get",
	path: "/api/quizzes/{id}",
	tags: ["Quizzes"],
	summary: "Quiz detail with questions",
	description: "Public quizzes are open to everyone; private ones only to their owner.",
	request: {
		params: IdParamsSchema,
	},
	responses: {
		200: jsonResponse(quizDetailResponseSchema, "The quiz with its questions and options."),
		404: errorResponse("Quiz not found or not visible to the viewer."),
	},
});

export const quizDetailHandler: RouteHandler<typeof quizDetailRoute, HonoEnv> = async (c) => {
	const { id } = c.req.valid("param");
	const viewer = currentUser(c);
	const quiz = await container(c).services.quiz.getForViewer(id, viewer?.id ?? null);
	return c.json({ quiz }, 200);
};
