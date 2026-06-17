import type { MiddlewareHandler } from "hono";
import { createContainer } from "../../app/lib/server/container";
import type { HonoEnv } from "../env";
import { getSessionToken } from "../http/cookies";

/**
 * Opens the database connection and builds the DI container once per request,
 * then resolves the authenticated user from the session cookie.
 */
export const diMiddleware: MiddlewareHandler<HonoEnv> = async (c, next) => {
	const container = createContainer(c.env);
	c.set("container", container);

	const token = getSessionToken(c);
	c.set("user", token ? await container.services.auth.authenticate(token) : null);

	await next();
};
