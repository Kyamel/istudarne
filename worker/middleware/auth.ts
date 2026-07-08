import type { MiddlewareHandler } from "hono";
import type { HonoEnv } from "../env";
import { getAccessTokenCookie } from "../http/cookies";

/**
 * Resolves the authenticated user from either transport:
 * - `Authorization: Bearer <access token>` — native apps;
 * - `istudarne_access` httpOnly cookie — the web app.
 * The access token is a short-lived JWT; expired tokens simply resolve to no
 * user and clients renew via POST /api/auth/refresh.
 */
export const authMiddleware: MiddlewareHandler<HonoEnv> = async (c, next) => {
	const header = c.req.header("Authorization");
	const bearer = header?.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : null;
	const token = bearer ?? getAccessTokenCookie(c);

	c.set("user", token ? await c.get("container").services.auth.authenticate(token) : null);

	await next();
};
