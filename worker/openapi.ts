import { createRoute, z } from "@hono/zod-openapi";

const ErrorTextSchema = z.string().openapi({
	example: "Invalid JSON.",
});

export const HealthResponseSchema = z
	.object({
		ok: z.boolean().openapi({ example: true }),
		app: z.string().openapi({ example: "istudarne" }),
		runtime: z.string().openapi({ example: "cloudflare-workers" }),
	})
	.openapi("HealthResponse");

export const QuizSummarySchema = z
	.object({
		id: z.string().openapi({
			example: "bb73ccde-e174-4290-874a-a34f4fb6dc54",
		}),
		title: z.string().openapi({
			example: "100-question multiple-choice bank - Human-Computer Interaction",
		}),
		description: z.string().nullable().openapi({
			example: "Multiple-choice questions with five options.",
		}),
		visibility: z.enum(["private", "public", "unlisted"]).openapi({
			example: "public",
		}),
		questionCount: z.number().int().nonnegative().openapi({ example: 100 }),
		playsCount: z.number().int().nonnegative().openapi({ example: 0 }),
		ownerUsername: z.string().openapi({ example: "demo" }),
		ownerDisplayName: z.string().openapi({ example: "Demo User" }),
		tags: z.array(z.string()).openapi({
			example: ["HCI", "Usability"],
		}),
	})
	.openapi("QuizSummary");

export const QuizSearchResponseSchema = z
	.object({
		quizzes: z.array(QuizSummarySchema),
	})
	.openapi("QuizSearchResponse");

export const QuizUploadResponseSchema = z
	.object({
		quiz: QuizSummarySchema,
	})
	.openapi("QuizUploadResponse");

export const SearchQuerySchema = z.object({
	q: z
		.string()
		.optional()
		.openapi({
			param: {
				name: "q",
				in: "query",
			},
			example: "IHC",
			description: "Partial search by quiz title.",
		}),
});

export const GroupChatParamsSchema = z.object({
	groupId: z.string().openapi({
		param: {
			name: "groupId",
			in: "path",
		},
		example: "hci-group",
	}),
});

export const UploadQuizFormSchema = z
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

export const healthRoute = createRoute({
	method: "get",
	path: "/api/health",
	tags: ["System"],
	summary: "Health check",
	responses: {
		200: {
			description: "Worker status.",
			content: {
				"application/json": {
					schema: HealthResponseSchema,
				},
			},
		},
	},
});

export const searchQuizzesRoute = createRoute({
	method: "get",
	path: "/api/quizzes/search",
	tags: ["Quizzes"],
	summary: "Search public quizzes",
	request: {
		query: SearchQuerySchema,
	},
	responses: {
		200: {
			description: "List of matching public quizzes.",
			content: {
				"application/json": {
					schema: QuizSearchResponseSchema,
				},
			},
		},
	},
});

export const uploadQuizRoute = createRoute({
	method: "post",
	path: "/api/quizzes/upload",
	tags: ["Quizzes"],
	summary: "Import quiz from JSON",
	description:
		"Validates a JSON file, stores the original file in R2, and normalizes the quiz, questions, options, and tags in D1.",
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
		201: {
			description: "Quiz imported successfully.",
			content: {
				"application/json": {
					schema: QuizUploadResponseSchema,
				},
			},
		},
		400: {
			description: "Missing file, invalid JSON, or invalid schema.",
			content: {
				"text/plain": {
					schema: ErrorTextSchema,
				},
			},
		},
		401: {
			description: "Unauthenticated user.",
			content: {
				"text/plain": {
					schema: ErrorTextSchema.openapi({
						example: "Please sign in to upload a quiz.",
					}),
				},
			},
		},
		413: {
			description: "File exceeds the accepted limit.",
			content: {
				"text/plain": {
					schema: ErrorTextSchema.openapi({
						example: "The JSON file must be at most 4 MB.",
					}),
				},
			},
		},
	},
});

export const groupChatRoute = createRoute({
	method: "get",
	path: "/api/groups/{groupId}/chat",
	tags: ["Groups"],
	summary: "Connect to the group chat",
	description:
		"WebSocket endpoint forwarded to the group's Durable Object. Use the Upgrade: websocket header.",
	request: {
		params: GroupChatParamsSchema,
	},
	responses: {
		101: {
			description: "WebSocket connection established.",
		},
		426: {
			description: "The route expects a WebSocket upgrade.",
			content: {
				"text/plain": {
					schema: z.string().openapi({ example: "Expected WebSocket" }),
				},
			},
		},
	},
});

export const openApiDocument = {
	openapi: "3.1.0",
	info: {
		title: "Istudarne API",
		version: "0.1.0",
		description:
			"Istudarne serverless API for quizzes, JSON uploads, public search, and community features.",
	},
	servers: [
		{
			url: "/",
			description: "Current environment",
		},
	],
};
