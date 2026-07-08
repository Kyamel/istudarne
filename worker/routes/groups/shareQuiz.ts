import type { HonoEnv } from "@api/env";
import { container, requireUser } from "@api/http/context";
import { authSecurity, errorResponse, IdParamsSchema, jsonBody, jsonResponse } from "@api/openapi";
import { createRoute, type RouteHandler } from "@hono/zod-openapi";
import { okResponseSchema, shareQuizRequestSchema } from "@shared/contracts";

export const shareQuizRoute = createRoute({
	method: "post",
	path: "/api/groups/{id}/quizzes",
	tags: ["Groups"],
	summary: "Share a quiz with a group",
	security: authSecurity,
	request: {
		params: IdParamsSchema,
		body: jsonBody(shareQuizRequestSchema),
	},
	responses: {
		200: jsonResponse(okResponseSchema, "Quiz shared."),
		401: errorResponse("Unauthenticated."),
		403: errorResponse("Not a member of the group."),
		404: errorResponse("Group or quiz not found."),
	},
});

export const shareQuizHandler: RouteHandler<typeof shareQuizRoute, HonoEnv> = async (c) => {
	const user = requireUser(c);
	const { id } = c.req.valid("param");
	const body = c.req.valid("json");
	await container(c).services.group.shareQuiz(id, user.id, body.quizId);
	return c.json({ ok: true as const }, 200);
};
