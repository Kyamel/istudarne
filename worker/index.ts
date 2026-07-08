import { ACCESS_COOKIE_NAME } from "@api/auth/cookies";
import { StudyGroupChat } from "@api/server/study-group-chat";
import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import type { Context, MiddlewareHandler } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import { csrf } from "hono/csrf";
import { etag } from "hono/etag";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import type { HonoEnv } from "./env";
import { detectLocale, renderLandingPage, renderNotFoundPage, renderSharePage } from "./html";
import { handleError } from "./http/errorHandler";
import { authMiddleware } from "./middleware/auth";
import { diMiddleware } from "./middleware/di";
import { rateLimitBy } from "./middleware/rateLimit";
import { openApiDocument } from "./openapi";
import { handleAiJobsBatch } from "./queue/aiJobs";
import { registerApiRoutes } from "./routes";

const app = new OpenAPIHono<HonoEnv>({
	/* Turns zod validation failures into the same `{ error }` JSON shape used
	   by AppError, instead of zod-openapi's default error payload. */
	defaultHook: (result, c) => {
		if (!result.success) {
			return c.json({ error: result.error.issues[0]?.message ?? "Invalid data." }, 400);
		}
	},
});

app.onError(handleError);

/* --------------------------- API middleware stack -------------------------- */

/** Origins allowed for credentialed cross-origin requests (web is same-origin;
 * add native shells like `capacitor://localhost` via the ALLOWED_ORIGINS var). */
function isAllowedOrigin(origin: string, c: Context<HonoEnv>): boolean {
	if (origin === new URL(c.req.url).origin) return true;
	const allowed = (c.env.ALLOWED_ORIGINS ?? "")
		.split(",")
		.map((entry) => entry.trim())
		.filter(Boolean);
	return allowed.includes(origin);
}

/* WebSocket upgrade responses have immutable headers; middleware that mutates
   or hashes the response body must not touch them. */
const unlessWebSocket =
	(middleware: MiddlewareHandler<HonoEnv>): MiddlewareHandler<HonoEnv> =>
	(c, next) =>
		c.req.header("upgrade")?.toLowerCase() === "websocket" ? next() : middleware(c, next);

/* CSP for HTML pages (landing, share pages, and the SPA shell served by the
   assets binding). The /api stack keeps its own secureHeaders (JSON needs no
   CSP), and /docs is excluded because Swagger UI loads assets from the
   jsdelivr CDN. In dev, Vite injects an inline react-refresh preamble and HMR
   talks over a same-host ws connection, hence the relaxations. */
const pageSecureHeaders = secureHeaders({
	contentSecurityPolicy: {
		defaultSrc: ["'self'"],
		scriptSrc: import.meta.env.DEV ? ["'self'", "'unsafe-inline'"] : ["'self'"],
		// 'unsafe-inline' covers the inline <style> of the server-rendered pages
		// and React style={} attributes; external stylesheets stay same-origin.
		styleSrc: ["'self'", "'unsafe-inline'"],
		imgSrc: ["'self'", "data:", "https:"],
		fontSrc: ["'self'", "data:"],
		connectSrc: [
			"'self'",
			// Group-chat WebSocket (and Vite HMR in dev) on the same host.
			(c) => {
				const url = new URL(c.req.url);
				return `${url.protocol === "https:" ? "wss" : "ws"}://${url.host}`;
			},
		],
		objectSrc: ["'none'"],
		baseUri: ["'self'"],
		formAction: ["'self'"],
		frameAncestors: ["'self'"],
	},
});

app.use("*", (c, next) => {
	const path = c.req.path;
	if (path.startsWith("/api/") || path.startsWith("/docs") || path.endsWith("/openapi.json")) {
		return next();
	}
	return pageSecureHeaders(c, next);
});

app.use("/api/*", requestId());
app.use("/api/*", logger());
app.use(
	"/api/*",
	cors({
		origin: (origin, c) => (isAllowedOrigin(origin, c as Context<HonoEnv>) ? origin : null),
		credentials: true,
	}),
);
/* Blocks cross-origin form submissions that ride on the auth cookies. Bearer
   requests are exempt: an Authorization header cannot be attached by a
   cross-site form, so there is nothing to forge. */
const csrfProtection = csrf({ origin: isAllowedOrigin });
app.use("/api/*", (c, next) => (c.req.header("Authorization") ? next() : csrfProtection(c, next)));
app.use("/api/*", unlessWebSocket(secureHeaders()));
app.use("/api/*", async (c, next) => {
	if (c.req.method !== "GET") {
		return next();
	}
	return unlessWebSocket(etag())(c, next);
});
app.use("/api/*", unlessWebSocket(prettyJSON()));
app.use(
	"/api/*",
	bodyLimit({
		maxSize: 5 * 1024 * 1024,
		onError: (c) => c.json({ error: "Request body too large." }, 413),
	}),
);
/* Brute-force/abuse protection on the sensitive endpoints. Registered after
   cors so CORS preflights are answered before consuming quota. The auth
   limiter throttles credential guessing and email spam; the AI limiter caps
   spend on the paid OpenAI-backed queue. */
const authRateLimit = rateLimitBy((env) => env.AUTH_RATE_LIMITER);
app.use("/api/auth/login", authRateLimit);
app.use("/api/auth/register", authRateLimit);
app.use("/api/auth/refresh", authRateLimit);
app.use("/api/auth/verify-email", authRateLimit);
app.use("/api/auth/resend-verification", authRateLimit);
app.use(
	"/api/ai/jobs",
	rateLimitBy((env) => env.AI_RATE_LIMITER),
);

app.use("/api/*", diMiddleware);
app.use("/api/*", authMiddleware);

/* ------------------------------ documentation ------------------------------ */

app.openAPIRegistry.registerComponent("securitySchemes", "BearerAuth", {
	type: "http",
	scheme: "bearer",
	bearerFormat: "JWT",
	description: "Access token issued by /api/auth/login or /api/auth/refresh (native apps).",
});
app.openAPIRegistry.registerComponent("securitySchemes", "CookieAuth", {
	type: "apiKey",
	in: "cookie",
	name: ACCESS_COOKIE_NAME,
	description: "httpOnly access-token cookie set for the web app.",
});

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

/* --------------------------------- pages ---------------------------------- */

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

// /app/* routes are handled by the React SPA, not here.
registerApiRoutes(app);

app.notFound((c) => {
	const url = new URL(c.req.url);

	// Unknown API routes respond with JSON.
	if (url.pathname.startsWith("/api/")) {
		return c.json({ error: "Resource not found." }, 404);
	}

	// Only top-level navigation to an unknown route renders the 404 page.
	// Paths with a file extension are static assets (e.g. /istudarne.webp) and
	// must reach the assets binding even when navigated to directly (browsers
	// send Accept: text/html on address-bar navigation).
	const isAppPath = url.pathname === "/app" || url.pathname.startsWith("/app/");
	const looksLikeFile = /\.[a-zA-Z0-9]+$/.test(url.pathname);
	const accept = c.req.header("accept") ?? "";
	if (!isAppPath && !looksLikeFile && accept.includes("text/html")) {
		return c.html(renderNotFoundPage(detectLocale(c.req.header("accept-language") ?? null)), 404);
	}

	// SPA routes, static files, and dev-server modules (e.g. /@vite/client)
	// are served by the assets binding. Re-wrap the response: fetch() responses
	// have immutable headers, and the page middleware above adds CSP to them.
	return (async () => {
		const asset = await c.env.ASSETS.fetch(c.req.raw);
		// With single-page-application not-found handling, the binding answers
		// unknown paths with the SPA shell (200 text/html). Getting HTML back
		// for a file-looking path means the asset does not exist — make it a
		// real 404 instead of shipping index.html as a fake .webp/.js/...
		if (
			looksLikeFile &&
			!url.pathname.endsWith(".html") &&
			(asset.headers.get("content-type") ?? "").includes("text/html")
		) {
			return c.text("Not found.", 404);
		}
		return new Response(asset.body, asset);
	})();
});

export { StudyGroupChat };

/* The Worker exports both the HTTP entry point (Hono) and the queue consumer
   that processes async AI jobs. */
export default {
	fetch: app.fetch,
	queue: handleAiJobsBatch,
};
