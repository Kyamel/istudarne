/**
 * Auth module — OpenAPI route definitions + handler factory.
 *
 * Route definitions are static (so the host can chain them with `.openapi()`
 * and the accumulated type feeds Swagger and the RPC client). Handlers come
 * from `createAuthApi`, which receives per-request accessors for the module's
 * services — the only wiring the host provides.
 */
import { createRoute, type RouteHandler, z } from "@hono/zod-openapi";
import type { Context, Env } from "hono";
import { HTTPException } from "hono/http-exception";
import {
	type AuthUser,
	authSessionResponseSchema,
	authUserResponseSchema,
	loginRequestSchema,
	okResponseSchema,
	refreshRequestSchema,
	refreshResponseSchema,
	registerRequestSchema,
	resendVerificationRequestSchema,
	verifyEmailRequestSchema,
} from "./contracts";
import { clearAuthCookies, getRefreshTokenCookie, setAuthCookies } from "./cookies";
import type { EmailService } from "./email";
import type { WithAuthUser } from "./middleware";
import type { AuthService } from "./service";

/* ----------------------- local OpenAPI helpers ----------------------------- */

const errorSchema = z.object({ error: z.string() });

const jsonBody = <T extends z.ZodType>(schema: T) => ({
	required: true,
	content: { "application/json": { schema } },
});

const jsonResponse = <T extends z.ZodType>(schema: T, description: string) => ({
	description,
	content: { "application/json": { schema } },
});

const errorResponse = (description: string) => ({
	description,
	content: { "application/json": { schema: errorSchema } },
});

/* Names must match the security schemes registered by the host app
   (see README: registerComponent BearerAuth / CookieAuth). */
const authSecurity: Record<string, string[]>[] = [{ BearerAuth: [] }, { CookieAuth: [] }];

export function verificationUrl(origin: string, token: string) {
	return `${origin}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
}

/* Minimal standalone page for the link opened from the email client. */
function verificationPage(title: string, message: string) {
	return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title></head>
<body style="font-family: system-ui, sans-serif; display: grid; place-items: center; min-height: 100vh; margin: 0; background: #17171b; color: #e8e8ec;">
<main style="text-align: center; padding: 2rem;">
<h1 style="color: #a78bfa;">${title}</h1>
<p>${message}</p>
<p><a href="/" style="color: #a78bfa;">Back to the app</a></p>
</main>
</body>
</html>`;
}

/* ----------------------------- route definitions --------------------------- */

export const registerRoute = createRoute({
	method: "post",
	path: "/api/auth/register",
	tags: ["Auth"],
	summary: "Create an account",
	description:
		"Creates the user and sends a verification email (Resend). The account must verify its " +
		"email before it can sign in, so no tokens are issued here — call /api/auth/login after " +
		"clicking the verification link.",
	request: { body: jsonBody(registerRequestSchema) },
	responses: {
		201: jsonResponse(authUserResponseSchema, "Account created; verification email sent."),
		400: errorResponse("Invalid payload."),
		409: errorResponse("Email or username already in use."),
	},
});

export const loginRoute = createRoute({
	method: "post",
	path: "/api/auth/login",
	tags: ["Auth"],
	summary: "Sign in with email and password",
	description:
		"Sets httpOnly auth cookies for web clients and returns the access/refresh token pair for " +
		"native clients (send the access token as `Authorization: Bearer`).",
	request: { body: jsonBody(loginRequestSchema) },
	responses: {
		200: jsonResponse(authSessionResponseSchema, "Signed in."),
		400: errorResponse("Invalid payload."),
		401: errorResponse("Incorrect email or password."),
		403: errorResponse("Email not verified yet."),
	},
});

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
	request: { body: jsonBody(refreshRequestSchema) },
	responses: {
		200: jsonResponse(refreshResponseSchema, "New token pair issued (cookies and/or body)."),
		401: errorResponse("Missing, invalid, expired, or reused refresh token."),
	},
});

export const logoutRoute = createRoute({
	method: "post",
	path: "/api/auth/logout",
	tags: ["Auth"],
	summary: "Sign out",
	description:
		"Revokes the refresh token (cookie or body) and clears the auth cookies. Native clients " +
		"should also discard their stored tokens.",
	request: { body: jsonBody(refreshRequestSchema) },
	responses: {
		200: jsonResponse(okResponseSchema, "Signed out."),
	},
});

export const meRoute = createRoute({
	method: "get",
	path: "/api/auth/me",
	tags: ["Auth"],
	summary: "Current user",
	security: authSecurity,
	responses: {
		200: jsonResponse(authUserResponseSchema, "The authenticated user."),
		401: errorResponse("Unauthenticated."),
	},
});

const verifyEmailQuerySchema = z.object({
	token: z
		.string()
		.min(1)
		.openapi({
			param: { name: "token", in: "query" },
			description: "Verification token from the email link.",
		}),
});

export const verifyEmailLinkRoute = createRoute({
	method: "get",
	path: "/api/auth/verify-email",
	tags: ["Auth"],
	summary: "Verify email (link from the email message)",
	request: { query: verifyEmailQuerySchema },
	responses: {
		200: {
			description: "Email verified; renders a confirmation page.",
			content: { "text/html": { schema: z.string() } },
		},
		400: {
			description: "Invalid or expired token; renders an error page.",
			content: { "text/html": { schema: z.string() } },
		},
	},
});

export const verifyEmailRoute = createRoute({
	method: "post",
	path: "/api/auth/verify-email",
	tags: ["Auth"],
	summary: "Verify email (JSON)",
	request: { body: jsonBody(verifyEmailRequestSchema) },
	responses: {
		200: jsonResponse(okResponseSchema, "Email verified."),
		400: errorResponse("Invalid or expired verification token."),
	},
});

export const resendVerificationRoute = createRoute({
	method: "post",
	path: "/api/auth/resend-verification",
	tags: ["Auth"],
	summary: "Resend the verification email",
	description:
		"Always responds ok. The email is only actually sent when the address belongs to an " +
		"account that has not verified yet and no email was sent in the last minute (server-side " +
		"resend cooldown).",
	request: { body: jsonBody(resendVerificationRequestSchema) },
	responses: {
		200: jsonResponse(okResponseSchema, "Verification email queued (when applicable)."),
		400: errorResponse("Invalid payload."),
	},
});

/* -------------------------------- handlers --------------------------------- */

export type AuthApiDeps<E extends Env & WithAuthUser> = {
	auth: (c: Context<E>) => AuthService;
	email: (c: Context<E>) => EmailService;
};

export function createAuthApi<E extends Env & WithAuthUser>(deps: AuthApiDeps<E>) {
	const registerHandler: RouteHandler<typeof registerRoute, E> = async (c) => {
		const body = c.req.valid("json");
		const { user, verificationToken } = await deps.auth(c).register(body);

		const url = verificationUrl(new URL(c.req.url).origin, verificationToken);
		c.executionCtx.waitUntil(deps.email(c).sendVerificationEmail(user.email, url));

		return c.json({ user }, 201);
	};

	const loginHandler: RouteHandler<typeof loginRoute, E> = async (c) => {
		const body = c.req.valid("json");
		const { user, tokens } = await deps.auth(c).login(body.email, body.password);
		setAuthCookies(c, tokens);
		return c.json({ user, tokens }, 200);
	};

	const refreshHandler: RouteHandler<typeof refreshRoute, E> = async (c) => {
		const body = c.req.valid("json");
		const token = body.refreshToken ?? getRefreshTokenCookie(c);
		if (!token) throw new HTTPException(401, { message: "Please sign in to continue." });

		const { user, tokens } = await deps.auth(c).refresh(token);
		setAuthCookies(c, tokens);

		/* Only bearer clients (token in body) get the pair echoed back; for
		   cookie clients that would hand the refresh token to any script running
		   on the page, defeating httpOnly. */
		if (body.refreshToken) {
			return c.json({ user, tokens }, 200);
		}
		return c.json({ user }, 200);
	};

	const logoutHandler: RouteHandler<typeof logoutRoute, E> = async (c) => {
		const body = c.req.valid("json");
		const token = body.refreshToken ?? getRefreshTokenCookie(c);
		if (token) await deps.auth(c).endSession(token);
		clearAuthCookies(c);
		return c.json({ ok: true as const }, 200);
	};

	const meHandler: RouteHandler<typeof meRoute, E> = (c) => {
		// Pin the abstract E["Variables"]["user"] down to the concrete type.
		const user: AuthUser | null = c.get("user");
		if (!user) throw new HTTPException(401, { message: "Please sign in to continue." });
		return c.json({ user }, 200);
	};

	const verifyEmailLinkHandler: RouteHandler<typeof verifyEmailLinkRoute, E> = async (c) => {
		const { token } = c.req.valid("query");
		try {
			await deps.auth(c).verifyEmail(token);
			return c.html(
				verificationPage("Email verified", "Your email address has been confirmed."),
				200,
			);
		} catch {
			return c.html(
				verificationPage(
					"Verification failed",
					"This verification link is invalid or has expired. Sign in and request a new one.",
				),
				400,
			);
		}
	};

	const verifyEmailHandler: RouteHandler<typeof verifyEmailRoute, E> = async (c) => {
		const { token } = c.req.valid("json");
		await deps.auth(c).verifyEmail(token);
		return c.json({ ok: true as const }, 200);
	};

	const resendVerificationHandler: RouteHandler<typeof resendVerificationRoute, E> = async (c) => {
		const { email } = c.req.valid("json");

		const pending = await deps.auth(c).requestEmailVerification(email);
		if (pending) {
			const url = verificationUrl(new URL(c.req.url).origin, pending.token);
			c.executionCtx.waitUntil(deps.email(c).sendVerificationEmail(pending.user.email, url));
		}

		return c.json({ ok: true as const }, 200);
	};

	return {
		registerRoute,
		registerHandler,
		loginRoute,
		loginHandler,
		refreshRoute,
		refreshHandler,
		logoutRoute,
		logoutHandler,
		meRoute,
		meHandler,
		verifyEmailLinkRoute,
		verifyEmailLinkHandler,
		verifyEmailRoute,
		verifyEmailHandler,
		resendVerificationRoute,
		resendVerificationHandler,
	};
}
