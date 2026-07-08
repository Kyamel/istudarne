/** Auth module — resolves the authenticated user from either transport. */
import type { Context, Env, MiddlewareHandler } from "hono";
import type { AuthUser } from "./contracts";
import { getAccessTokenCookie } from "./cookies";
import type { AuthService } from "./service";

/** The host app's Hono env must expose the resolved user under `user`. */
export type WithAuthUser = { Variables: { user: AuthUser | null } };

/**
 * - `Authorization: Bearer <access token>` — native apps;
 * - httpOnly access cookie — the web app.
 * The access token is a short-lived JWT; expired tokens simply resolve to no
 * user and clients renew via POST /api/auth/refresh.
 */
export function createAuthMiddleware<E extends Env & WithAuthUser>(
	getAuth: (c: Context<E>) => AuthService,
): MiddlewareHandler<E> {
	return async (c, next) => {
		const header = c.req.header("Authorization");
		const bearer = header?.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : null;
		const token = bearer ?? getAccessTokenCookie(c);

		c.set("user", token ? await getAuth(c).authenticate(token) : null);

		await next();
	};
}
