import type { OpenAPIHono } from "@hono/zod-openapi";
import type { Container } from "@server/container";
import type { AuthUser } from "@server/domain/types";

export type HonoEnv = {
	Bindings: Env;
	Variables: {
		container: Container;
		user: AuthUser | null;
	};
};

export type App = OpenAPIHono<HonoEnv>;
