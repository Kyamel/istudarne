import { createRoute, type RouteHandler } from "@hono/zod-openapi";
import { unauthorized } from "@api/server/errors";
import { refreshRequestSchema, refreshResponseSchema } from "@shared/contracts";
import type { HonoEnv } from "@api/env";
import { container } from "@api/http/context";
import { getRefreshTokenCookie, setAuthCookies } from "@api/http/cookies";
import { errorResponse, jsonBody, jsonResponse } from "@api/openapi";

export const refreshRoute = createRoute({
	method: "post",
	path: "/api/auth/refresh",
	tags: ["Auth"],
	summary: "Rotate the refresh token and issue a new access token",
	description:
		"Web clients rely on the httpOnly refresh cookie and send an empty JSON body; native clients " +
		"send their stored refresh token in the body. The refresh token is rotated on every call and " +
		"reuse of an old token revokes every session of the user. `tokens` is returned in the body " +
		"only when the refresh token was sent in the body; cookie clients receive the new pair " +
		"exclusively as httpOnly cookies.",
	request: {
		body: jsonBody(refreshRequestSchema),
	},
	responses: {
		200: jsonResponse(refreshResponseSchema, "New token pair issued (cookies and/or body)."),
		401: errorResponse("Missing, invalid, expired, or reused refresh token."),
	},
});

export const refreshHandler: RouteHandler<typeof refreshRoute, HonoEnv> = async (c) => {
	const body = c.req.valid("json");
	const token = body.refreshToken ?? getRefreshTokenCookie(c);
	if (!token) throw unauthorized("Please sign in to continue.");

	const { user, tokens } = await container(c).services.auth.refresh(token);
	setAuthCookies(c, tokens);

	/* Only bearer clients (token in body) get the pair echoed back; for cookie
	   clients that would hand the refresh token to any script running on the
	   page, defeating httpOnly. */
	if (body.refreshToken) {
		return c.json({ user, tokens }, 200);
	}
	return c.json({ user }, 200);
};
