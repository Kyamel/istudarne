import type { DomainUser, SessionData, SessionUser } from "@api/auth";
import type { HonoEnv } from "@api/env";
import type { Container } from "@api/server/container";
import { unauthorized } from "@api/server/errors";
import type { Context } from "hono";

export function container(c: Context<HonoEnv>): Container {
	return c.get("container");
}

/** The linked domain profile, or null when anonymous. */
export function currentUser(c: Context<HonoEnv>): DomainUser | null {
	return c.get("domainUser");
}

/** The Better Auth identity (email, verification), or null when anonymous. */
export function currentAuthUser(c: Context<HonoEnv>): SessionUser | null {
	return c.get("authUser");
}

/** The active Better Auth session, or null when anonymous. */
export function currentSession(c: Context<HonoEnv>): SessionData | null {
	return c.get("session");
}

/** Ensures there is an authenticated user with a domain profile, throwing
 *  AppError(401) otherwise. Returns the domain profile the routes join against. */
export function requireUser(c: Context<HonoEnv>): DomainUser {
	const user = c.get("domainUser");
	if (!user) throw unauthorized();
	return user;
}
