import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import { StudyGroupChat } from "@server/study-group-chat";
import { cors } from "hono/cors";
import type { HonoEnv } from "./env";
import { detectLocale, renderLandingPage, renderNotFoundPage, renderSharePage } from "./html";
import { handleError } from "./http/errorHandler";
import { diMiddleware } from "./middleware/di";
import { openApiDocument } from "./openapi";
import { registerApiRoutes } from "./routes";

const app = new OpenAPIHono<HonoEnv>();

app.onError(handleError);

app.use("/api/*", cors({ origin: (origin) => origin, credentials: true }));
app.use("/api/*", diMiddleware);

app.get("/docs", swaggerUI({ url: "/openapi.json" }));
app.get("/docs/", swaggerUI({ url: "/openapi.json" }));
app.get("/api/docs", swaggerUI({ url: "/openapi.json" }));
app.get("/api/docs/", swaggerUI({ url: "/openapi.json" }));
app.doc("/openapi.json", openApiDocument);
app.doc("/api/openapi.json", openApiDocument);

/* Machine-readable entry point for AI agents and RAG pipelines (llms.txt
   convention). Points to the OpenAPI spec and the quiz export endpoints. */
app.get("/llms.txt", (c) => {
	const origin = new URL(c.req.url).origin;
	return c.text(
		`# Istudarne

> Gamified quiz-based study platform. Users import JSON question banks, answer
> quizzes, track progress and share public quizzes.

## API

- [OpenAPI spec](${origin}/openapi.json): full REST API description
- [API docs](${origin}/docs): interactive Swagger UI

## Content for retrieval

- Public quiz search: GET ${origin}/api/quizzes/search?q=<query>
- Quiz detail (JSON): GET ${origin}/api/quizzes/:id
- Quiz export for RAG (Markdown, one section per question):
  GET ${origin}/api/quizzes/:id/export?format=markdown
- Shareable quiz pages (server-rendered HTML with JSON-LD Quiz schema):
  ${origin}/share/quizzes/:id

Private quizzes require an authenticated session; only public content is
available anonymously.
`,
		200,
		{ "Content-Type": "text/plain; charset=utf-8" },
	);
});

app.get("/", (c) =>
	c.html(
		renderLandingPage(
			detectLocale(c.req.header("accept-language") ?? null),
			new URL(c.req.url).origin,
		),
	),
);

app.get("/share/quizzes/:quizId", async (c) => {
	const quizId = c.req.param("quizId");
	const locale = detectLocale(c.req.header("accept-language") ?? null);
	const quiz = await c.env.DB.prepare(
		`SELECT q.id, q.title, q.description, q.visibility, q.question_count AS questionCount,
		        u.display_name AS authorName
		 FROM quizzes q
		 JOIN users u ON u.id = q.owner_id
		 WHERE q.id = ? AND q.visibility IN ('public', 'unlisted')`,
	)
		.bind(quizId)
		.first<{
			id: string;
			title: string;
			description: string | null;
			visibility: string;
			questionCount: number;
			authorName: string;
		}>();

	if (!quiz) {
		return c.html(renderNotFoundPage(locale), 404);
	}

	return c.html(
		renderSharePage({
			id: quiz.id,
			title: quiz.title,
			description: quiz.description || "Shared quiz on Istudarne.",
			questionCount: quiz.questionCount,
			authorName: quiz.authorName,
			indexable: quiz.visibility === "public",
			origin: new URL(c.req.url).origin,
			locale,
		}),
	);
});

registerApiRoutes(app);

app.notFound((c) => {
	const url = new URL(c.req.url);

	// Unknown API routes respond with JSON.
	if (url.pathname.startsWith("/api/")) {
		return c.json({ error: "Resource not found." }, 404);
	}

	// Only top-level navigation to an unknown route renders the 404 page.
	const isAppPath = url.pathname === "/app" || url.pathname.startsWith("/app/");
	const accept = c.req.header("accept") ?? "";
	if (!isAppPath && accept.includes("text/html")) {
		return c.html(renderNotFoundPage(detectLocale(c.req.header("accept-language") ?? null)), 404);
	}

	// SPA routes, static files, and dev-server modules (e.g. /@vite/client)
	// are served by the assets binding.
	return c.env.ASSETS.fetch(c.req.raw);
});

export { StudyGroupChat };
export default app;
