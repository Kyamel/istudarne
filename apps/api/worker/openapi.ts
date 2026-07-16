import { z } from "@hono/zod-openapi";

/* ------------------------------ shared pieces ------------------------------ */

export const ErrorResponseSchema = z
	.object({
		error: z.string().openapi({ example: "Resource not found." }),
	})
	.openapi("ErrorResponse");

/** JSON request body descriptor for createRoute. */
export const jsonBody = <T extends z.ZodType>(schema: T) => ({
	required: true,
	content: { "application/json": { schema } },
});

/** JSON response descriptor for createRoute. */
export const jsonResponse = <T extends z.ZodType>(schema: T, description: string) => ({
	description,
	content: { "application/json": { schema } },
});

/** Error response descriptor (all errors share the `{ error }` JSON shape). */
export const errorResponse = (description: string) => ({
	description,
	content: { "application/json": { schema: ErrorResponseSchema } },
});

/**
 * Marks a route as authenticated in the OpenAPI document. Both transports are
 * accepted: `Authorization: Bearer` (native apps) or the access cookie (web).
 */
export const authSecurity: Record<string, string[]>[] = [{ BearerAuth: [] }, { CookieAuth: [] }];

/* ------------------------------ path params ------------------------------- */

export const IdParamsSchema = z.object({
	id: z.string().openapi({
		param: { name: "id", in: "path" },
		example: "bb73ccde-e174-4290-874a-a34f4fb6dc54",
	}),
});

export const UsernameParamsSchema = z.object({
	username: z.string().openapi({
		param: { name: "username", in: "path" },
		example: "demo",
	}),
});

export const GroupIdParamsSchema = z.object({
	groupId: z.string().openapi({
		param: { name: "groupId", in: "path" },
		example: "hci-group",
	}),
});

export const JobIdParamsSchema = z.object({
	jobId: z.string().openapi({
		param: { name: "jobId", in: "path" },
		example: "0d5ffb96-6a53-4f5e-9464-3e02a1a1ed21",
	}),
});

/* ------------------------------- document --------------------------------- */

export const openApiDocument = {
	openapi: "3.1.0",
	info: {
		title: "Istudarne API",
		version: "0.2.0",
		description:
			"Istudarne serverless API for quizzes, JSON uploads, public search, community features, and async AI jobs. " +
			"Authentication is handled by Better Auth with stateful Postgres sessions; " +
			"web clients use httpOnly cookies, native clients use Bearer headers.",
	},
	servers: [
		{
			url: "/",
			description: "Current environment",
		},
	],
};
