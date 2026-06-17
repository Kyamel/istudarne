import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { StudyGroupChat } from "../app/lib/server/study-group-chat";
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

app.get("/", (c) =>
	c.html(renderLandingPage(detectLocale(c.req.header("accept-language") ?? null))),
);

app.get("/share/quizzes/:quizId", async (c) => {
	const quizId = c.req.param("quizId");
	const locale = detectLocale(c.req.header("accept-language") ?? null);
	const quiz = await c.env.DB.prepare(
		"SELECT id, title, description FROM quizzes WHERE id = ? AND visibility IN ('public', 'unlisted')",
	)
		.bind(quizId)
		.first<{ id: string; title: string; description: string | null }>();

	if (!quiz) {
		return c.html(renderNotFoundPage(locale), 404);
	}

	return c.html(
		renderSharePage({
			id: quiz.id,
			title: quiz.title,
			description: quiz.description || "Shared quiz on Istudarne.",
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
