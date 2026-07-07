import type { Container } from "@server/container";
import type { AuthUser } from "@server/domain/types";
import { unauthorized } from "@server/errors";
import type { Context } from "hono";
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
