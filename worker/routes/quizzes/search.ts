import type { HonoEnv } from "@api/env";
import { container } from "@api/http/context";
import { jsonResponse } from "@api/openapi";
import { createRoute, type RouteHandler, z } from "@hono/zod-openapi";
import { quizListResponseSchema } from "@shared/contracts";

const SearchQuerySchema = z.object({
	q: z
		.string()
		.optional()
		.openapi({
			param: { name: "q", in: "query" },
			example: "IHC",
			description: "Partial search by quiz title.",
		}),
});

export const searchQuizzesRoute = createRoute({
	method: "get",
	path: "/api/quizzes/search",
	tags: ["Quizzes"],
	summary: "Search public quizzes",
	request: {
		query: SearchQuerySchema,
	},
	responses: {
		200: jsonResponse(quizListResponseSchema, "List of matching public quizzes."),
	},
});

export const searchQuizzesHandler: RouteHandler<typeof searchQuizzesRoute, HonoEnv> = async (c) => {
	const query = c.req.valid("query").q?.trim() ?? "";
	const quizzes = await container(c).services.quiz.search(query);
	return c.json({ quizzes }, 200);
};
