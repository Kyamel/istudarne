import type { HonoEnv } from "@api/env";
import { currentAuthUser, currentUser } from "@api/http/context";
import { authSecurity, errorResponse, jsonResponse } from "@api/openapi";
import { createRoute, type RouteHandler, z } from "@hono/zod-openapi";

const authUserSchema = z.object({
	id: z.string(),
	email: z.string(),
	emailVerified: z.boolean(),
	name: z.string(),
	image: z.string().nullish(),
});

const domainUserSchema = z.object({
	id: z.string(),
	username: z.string(),
	displayName: z.string(),
	bio: z.string().nullable(),
	avatarUrl: z.string().nullable(),
});

const meResponseSchema = z.object({
	authUser: authUserSchema,
	domainUser: domainUserSchema.nullable(),
});

export const whoamiRoute = createRoute({
	method: "get",
	path: "/api/me",
	tags: ["Me"],
	summary: "The current user (auth identity + domain profile)",
	security: authSecurity,
	responses: {
		200: jsonResponse(meResponseSchema, "The authenticated user."),
		401: errorResponse("Unauthenticated."),
	},
});

export const whoamiHandler: RouteHandler<typeof whoamiRoute, HonoEnv> = (c) => {
	const authUser = currentAuthUser(c);
	if (!authUser) {
		return c.json({ error: "Unauthenticated." }, 401);
	}
	const domainUser = currentUser(c);
	return c.json(
		{
			authUser: {
				id: authUser.id,
				email: authUser.email,
				emailVerified: authUser.emailVerified,
				name: authUser.name,
				image: authUser.image,
			},
			domainUser: domainUser
				? {
						id: domainUser.id,
						username: domainUser.username,
						displayName: domainUser.displayName,
						bio: domainUser.bio,
						avatarUrl: domainUser.avatarUrl,
					}
				: null,
		},
		200,
	);
};
