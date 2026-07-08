import type { HonoEnv } from "@api/env";
import { container, requireUser } from "@api/http/context";
import { authSecurity, errorResponse, jsonBody, jsonResponse } from "@api/openapi";
import { createRoute, type RouteHandler } from "@hono/zod-openapi";
import { aiJobResponseSchema, createAiJobRequestSchema } from "@shared/contracts";

export const createAiJobRoute = createRoute({
	method: "post",
	path: "/api/ai/jobs",
	tags: ["AI"],
	summary: "Enqueue an AI job",
	description:
		"AI calls (OpenAI) take seconds, far beyond what a request should block on, so they run " +
		"asynchronously: the payload is stored in R2, the job is pushed to a Cloudflare Queue, and " +
		"this endpoint returns 202 immediately. Poll GET /api/ai/jobs/{jobId} for the result.",
	security: authSecurity,
	request: {
		body: jsonBody(createAiJobRequestSchema),
	},
	responses: {
		202: jsonResponse(aiJobResponseSchema, "Job accepted and queued."),
		400: errorResponse("Invalid payload."),
		401: errorResponse("Unauthenticated."),
	},
});

export const createAiJobHandler: RouteHandler<typeof createAiJobRoute, HonoEnv> = async (c) => {
	const user = requireUser(c);
	const body = c.req.valid("json");
	const job = await container(c).services.ai.createJob(user.id, body);
	return c.json({ job }, 202);
};
