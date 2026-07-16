import type { HonoEnv } from "@api/env";
import { container, requireUser } from "@api/http/context";
import { authSecurity, errorResponse, jsonResponse } from "@api/openapi";
import { AppError, badRequest } from "@api/server/errors";
import { createRoute, type RouteHandler, z } from "@hono/zod-openapi";
import { quizSummaryResponseSchema } from "@istudarne/contracts";

const UploadQuizFormSchema = z
	.object({
		file: z.any().openapi({
			type: "string",
			format: "binary",
			description: "JSON file in the Istudarne quiz format.",
		}),
		visibility: z.enum(["private", "public"]).optional().openapi({
			example: "private",
			description: "Initial visibility for the imported quiz.",
		}),
	})
	.openapi("UploadQuizForm");

export const uploadQuizRoute = createRoute({
	method: "post",
	path: "/api/quizzes/upload",
	tags: ["Quizzes"],
	summary: "Import quiz from JSON",
	description:
		"Validates a JSON file, stores the original file in R2, and normalizes the quiz, questions, options, and tags in D1.",
	security: authSecurity,
	request: {
		body: {
			required: true,
			content: {
				"multipart/form-data": {
					schema: UploadQuizFormSchema,
				},
			},
		},
	},
	responses: {
		201: jsonResponse(quizSummaryResponseSchema, "Quiz imported successfully."),
		400: errorResponse("Missing file, invalid JSON, or invalid schema."),
		401: errorResponse("Unauthenticated."),
		413: errorResponse("File exceeds the accepted limit."),
	},
});

export const uploadQuizHandler: RouteHandler<typeof uploadQuizRoute, HonoEnv> = async (c) => {
	const user = requireUser(c);

	const form = await c.req.formData();
	const file = form.get("file");
	const visibility = form.get("visibility") === "public" ? "public" : "private";

	if (!(file instanceof File)) {
		throw badRequest("Send a JSON file in the file field.");
	}
	if (file.size > 1024 * 1024 * 4) {
		throw new AppError(413, "The JSON file must be at most 4 MB.");
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(await file.text());
	} catch {
		throw badRequest("Invalid JSON.");
	}

	try {
		const quiz = await container(c).services.quiz.importFromJson(parsed, visibility, user);
		return c.json({ quiz }, 201);
	} catch (error) {
		if (error instanceof AppError) throw error;
		throw badRequest(error instanceof Error ? error.message : "Import failed.");
	}
};
