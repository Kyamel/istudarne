import { createRoute, type RouteHandler } from "@hono/zod-openapi";
import { okResponseSchema, refreshRequestSchema } from "@shared/contracts";
import type { HonoEnv } from "@api/env";
import { container } from "@api/http/context";
import { clearAuthCookies, getRefreshTokenCookie } from "@api/http/cookies";
import { jsonBody, jsonResponse } from "@api/openapi";

export const logoutRoute = createRoute({
	method: "post",
	path: "/api/auth/logout",
	tags: ["Auth"],
	summary: "Sign out",
	description:
		"Revokes the refresh token (cookie or body) and clears the auth cookies. Native clients " +
		"should also discard their stored tokens.",
	request: {
		body: jsonBody(refreshRequestSchema),
	},
	responses: {
		200: jsonResponse(okResponseSchema, "Signed out."),
	},
});

export const logoutHandler: RouteHandler<typeof logoutRoute, HonoEnv> = async (c) => {
	const body = c.req.valid("json");
	const token = body.refreshToken ?? getRefreshTokenCookie(c);
	if (token) await container(c).services.auth.endSession(token);
	clearAuthCookies(c);
	return c.json({ ok: true as const }, 200);
};
