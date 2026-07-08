import { createRoute, type RouteHandler } from "@hono/zod-openapi";
import { aiJobResponseSchema } from "@shared/contracts";
import type { HonoEnv } from "@api/env";
import { container, requireUser } from "@api/http/context";
import { authSecurity, errorResponse, JobIdParamsSchema, jsonResponse } from "@api/openapi";

export const getAiJobRoute = createRoute({
	method: "get",
	path: "/api/ai/jobs/{jobId}",
	tags: ["AI"],
	summary: "AI job status and result",
	description: "Poll until `status` is `succeeded` (result included) or `failed` (see `error`).",
	security: authSecurity,
	request: {
		params: JobIdParamsSchema,
	},
	responses: {
		200: jsonResponse(aiJobResponseSchema, "Current job state."),
		401: errorResponse("Unauthenticated."),
		404: errorResponse("Job not found."),
	},
});

export const getAiJobHandler: RouteHandler<typeof getAiJobRoute, HonoEnv> = async (c) => {
	const user = requireUser(c);
	const { jobId } = c.req.valid("param");
	const job = await container(c).services.ai.getJob(jobId, user.id);
	return c.json({ job }, 200);
};
