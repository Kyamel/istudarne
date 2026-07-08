import type { HonoEnv } from "@api/env";
import { createContainer } from "@api/server/container";
import type { MiddlewareHandler } from "hono";

/**
 * Opens the database connection and builds the DI container once per request.
 * User resolution lives in the auth middleware.
 */
export const diMiddleware: MiddlewareHandler<HonoEnv> = async (c, next) => {
	c.set("container", createContainer(c.env));
	await next();
};
