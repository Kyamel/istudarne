import type { Container } from "@api/server/container";
import type { AuthUser } from "@api/server/domain/types";
import type { OpenAPIHono } from "@hono/zod-openapi";

export type HonoEnv = {
	Bindings: Env;
	Variables: {
		container: Container;
		user: AuthUser | null;
	};
};

export type App = OpenAPIHono<HonoEnv>;
