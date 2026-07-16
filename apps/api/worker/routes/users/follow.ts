import type { HonoEnv } from "@api/env";
import { container, requireUser } from "@api/http/context";
import { authSecurity, errorResponse, jsonResponse, UsernameParamsSchema } from "@api/openapi";
import { createRoute, type RouteHandler } from "@hono/zod-openapi";
import { okResponseSchema } from "@istudarne/contracts";

const followResponses = {
	200: jsonResponse(okResponseSchema, "Done."),
	401: errorResponse("Unauthenticated."),
	404: errorResponse("User not found."),
};

export const followRoute = createRoute({
	method: "post",
	path: "/api/users/{username}/follow",
	tags: ["Users"],
	summary: "Follow a user",
	security: authSecurity,
	request: { params: UsernameParamsSchema },
	responses: followResponses,
});

export const followHandler: RouteHandler<typeof followRoute, HonoEnv> = async (c) => {
	const user = requireUser(c);
	const { username } = c.req.valid("param");
	await container(c).services.profile.follow(user.id, username);
	return c.json({ ok: true as const }, 200);
};

export const unfollowRoute = createRoute({
	method: "delete",
	path: "/api/users/{username}/follow",
	tags: ["Users"],
	summary: "Unfollow a user",
	security: authSecurity,
	request: { params: UsernameParamsSchema },
	responses: followResponses,
});

export const unfollowHandler: RouteHandler<typeof unfollowRoute, HonoEnv> = async (c) => {
	const user = requireUser(c);
	const { username } = c.req.valid("param");
	await container(c).services.profile.unfollow(user.id, username);
	return c.json({ ok: true as const }, 200);
};
