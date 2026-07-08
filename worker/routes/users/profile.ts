import type { HonoEnv } from "@api/env";
import { container, currentUser } from "@api/http/context";
import { errorResponse, jsonResponse, UsernameParamsSchema } from "@api/openapi";
import { createRoute, type RouteHandler } from "@hono/zod-openapi";
import { profileResponseSchema } from "@shared/contracts";

export const profileRoute = createRoute({
	method: "get",
	path: "/api/users/{username}",
	tags: ["Users"],
	summary: "Public profile",
	request: {
		params: UsernameParamsSchema,
	},
	responses: {
		200: jsonResponse(profileResponseSchema, "Profile with stats and public quizzes."),
		404: errorResponse("User not found."),
	},
});

export const profileHandler: RouteHandler<typeof profileRoute, HonoEnv> = async (c) => {
	const { username } = c.req.valid("param");
	const viewer = currentUser(c);
	const profile = await container(c).services.profile.get(username, viewer?.id ?? null);
	return c.json({ profile }, 200);
};
