import type { DomainUser, SessionData, SessionUser } from "@api/auth";
import type { Container } from "@api/server/container";
import type { OpenAPIHono } from "@hono/zod-openapi";

export type HonoEnv = {
	Bindings: CloudflareBindings;
	Variables: {
		container: Container;
		/** Better Auth identity (email/verification), or null when anonymous. */
		authUser: SessionUser | null;
		/** Active Better Auth session, or null when anonymous. */
		session: SessionData | null;
		/** Linked domain profile (the id every domain table joins against). */
		domainUser: DomainUser | null;
	};
};

export type App = OpenAPIHono<HonoEnv>;
