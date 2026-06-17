import type { Context } from "hono";
import type { Container } from "../../app/lib/server/container";
import type { AuthUser } from "../../app/lib/server/domain/types";
import { unauthorized } from "../../app/lib/server/errors";
import type { HonoEnv } from "../env";

export function container(c: Context<HonoEnv>): Container {
	return c.get("container");
}

export function currentUser(c: Context<HonoEnv>): AuthUser | null {
	return c.get("user");
}

/** Ensures there is an authenticated user, throwing AppError(401) otherwise. */
export function requireUser(c: Context<HonoEnv>): AuthUser {
	const user = c.get("user");
	if (!user) throw unauthorized();
	return user;
}
