import type { HonoEnv } from "@api/env";
import { createContainer, disposeContainer } from "@api/server/container";
import type { MiddlewareHandler } from "hono";

/**
 * Opens the database connection and builds the DI container once per request.
 * User resolution lives in the auth middleware.
 */
export const diMiddleware: MiddlewareHandler<HonoEnv> = async (c, next) => {
	const container = createContainer(c.env);
	c.set("container", container);

	try {
		await next();
	} finally {
		c.executionCtx.waitUntil(disposeContainer(container));
	}
};
