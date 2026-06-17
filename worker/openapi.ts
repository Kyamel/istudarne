import { createRoute, z } from "@hono/zod-openapi";

const ErrorTextSchema = z.string().openapi({
	example: "JSON inválido.",
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
			example: "Banco de 100 Questões Objetivas - Interação Humano-Computador",
		}),
		description: z.string().nullable().openapi({
			example: "Questões de múltipla escolha com cinco alternativas.",
		}),
		visibility: z.enum(["private", "public", "unlisted"]).openapi({
			example: "public",
		}),
		questionCount: z.number().int().nonnegative().openapi({ example: 100 }),
		playsCount: z.number().int().nonnegative().openapi({ example: 0 }),
		ownerUsername: z.string().openapi({ example: "demo" }),
		ownerDisplayName: z.string().openapi({ example: "Usuário Demo" }),
		tags: z.array(z.string()).openapi({
			example: ["IHC", "Usabilidade"],
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
			description: "Busca parcial pelo título do quiz.",
		}),
});

export const GroupChatParamsSchema = z.object({
	groupId: z.string().openapi({
		param: {
			name: "groupId",
			in: "path",
		},
		example: "grupo-ihc",
	}),
});

export const UploadQuizFormSchema = z
	.object({
		file: z.any().openapi({
			type: "string",
			format: "binary",
			description: "Arquivo JSON no formato de quiz do Istudarne.",
		}),
		visibility: z.enum(["private", "public"]).optional().openapi({
			example: "private",
			description: "Visibilidade inicial do quiz importado.",
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
			description: "Status do Worker.",
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
	summary: "Pesquisar quizzes públicos",
	request: {
		query: SearchQuerySchema,
	},
	responses: {
		200: {
			description: "Lista de quizzes públicos encontrados.",
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
	summary: "Importar quiz por JSON",
	description:
		"Valida um arquivo JSON, salva o arquivo original no R2 e normaliza quiz, questões, alternativas e tags no D1.",
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
			description: "Quiz importado com sucesso.",
			content: {
				"application/json": {
					schema: QuizUploadResponseSchema,
				},
			},
		},
		400: {
			description: "Arquivo ausente, JSON inválido ou schema inválido.",
			content: {
				"text/plain": {
					schema: ErrorTextSchema,
				},
			},
		},
		401: {
			description: "Usuário não autenticado.",
			content: {
				"text/plain": {
					schema: ErrorTextSchema.openapi({
						example: "Faça login para enviar um quiz.",
					}),
				},
			},
		},
		413: {
			description: "Arquivo maior que o limite aceito.",
			content: {
				"text/plain": {
					schema: ErrorTextSchema.openapi({
						example: "O arquivo JSON deve ter no máximo 4 MB.",
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
	summary: "Conectar ao chat do grupo",
	description:
		"Endpoint WebSocket encaminhado para o Durable Object do grupo. Use header Upgrade: websocket.",
	request: {
		params: GroupChatParamsSchema,
	},
	responses: {
		101: {
			description: "Conexão WebSocket estabelecida.",
		},
		426: {
			description: "A rota espera upgrade para WebSocket.",
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
			"API serverless do Istudarne para quizzes, upload de JSON, busca pública e comunidade.",
	},
	servers: [
		{
			url: "/",
			description: "Ambiente atual",
		},
	],
};
