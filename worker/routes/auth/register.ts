import { createRoute, type RouteHandler } from "@hono/zod-openapi";
import { authUserResponseSchema, registerRequestSchema } from "@shared/contracts";
import type { HonoEnv } from "@api/env";
import { container } from "@api/http/context";
import { errorResponse, jsonBody, jsonResponse } from "@api/openapi";
import { verificationUrl } from "./verifyEmail";

export const registerRoute = createRoute({
	method: "post",
	path: "/api/auth/register",
	tags: ["Auth"],
	summary: "Create an account",
	description:
		"Creates the user and sends a verification email (Resend). The account must verify its " +
		"email before it can sign in, so no tokens are issued here — call /api/auth/login after " +
		"clicking the verification link.",
	request: {
		body: jsonBody(registerRequestSchema),
	},
	responses: {
		201: jsonResponse(authUserResponseSchema, "Account created; verification email sent."),
		400: errorResponse("Invalid payload."),
		409: errorResponse("Email or username already in use."),
	},
});

export const registerHandler: RouteHandler<typeof registerRoute, HonoEnv> = async (c) => {
	const body = c.req.valid("json");
	const { services } = container(c);
	const { user, verificationToken } = await services.auth.register(body);

	const url = verificationUrl(new URL(c.req.url).origin, verificationToken);
	c.executionCtx.waitUntil(services.email.sendVerificationEmail(user.email, url));

	return c.json({ user }, 201);
};
