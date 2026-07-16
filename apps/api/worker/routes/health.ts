import { createRoute, type RouteHandler, z } from "@hono/zod-openapi";
import type { HonoEnv } from "../env";
import { jsonResponse } from "../openapi";

const HealthResponseSchema = z
	.object({
		ok: z.boolean().openapi({ example: true }),
		app: z.string().openapi({ example: "istudarne" }),
		runtime: z.string().openapi({ example: "cloudflare-workers" }),
	})
	.openapi("HealthResponse");

export const healthRoute = createRoute({
	method: "get",
	path: "/api/health",
	tags: ["System"],
	summary: "Health check",
	responses: {
		200: jsonResponse(HealthResponseSchema, "Worker status."),
	},
});

export const healthHandler: RouteHandler<typeof healthRoute, HonoEnv> = (c) =>
	c.json({ ok: true, app: "istudarne", runtime: "cloudflare-workers" }, 200);
