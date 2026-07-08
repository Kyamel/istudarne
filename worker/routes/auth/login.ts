import { createRoute, type RouteHandler } from "@hono/zod-openapi";
import { authSessionResponseSchema, loginRequestSchema } from "@shared/contracts";
import type { HonoEnv } from "@api/env";
import { container } from "@api/http/context";
import { setAuthCookies } from "@api/http/cookies";
import { errorResponse, jsonBody, jsonResponse } from "@api/openapi";

export const loginRoute = createRoute({
	method: "post",
	path: "/api/auth/login",
	tags: ["Auth"],
	summary: "Sign in with email and password",
	description:
		"Sets httpOnly auth cookies for web clients and returns the access/refresh token pair for " +
		"native clients (send the access token as `Authorization: Bearer`).",
	request: {
		body: jsonBody(loginRequestSchema),
	},
	responses: {
		200: jsonResponse(authSessionResponseSchema, "Signed in."),
		400: errorResponse("Invalid payload."),
		401: errorResponse("Incorrect email or password."),
		403: errorResponse("Email not verified yet."),
	},
});

export const loginHandler: RouteHandler<typeof loginRoute, HonoEnv> = async (c) => {
	const body = c.req.valid("json");
	const { user, tokens } = await container(c).services.auth.login(body.email, body.password);
	setAuthCookies(c, tokens);
	return c.json({ user, tokens }, 200);
};
