import { StudyGroupChat } from "@api/server/study-group-chat";
import { OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import type { Context, MiddlewareHandler } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import { csrf } from "hono/csrf";
import { etag } from "hono/etag";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { createAuth } from "./auth";
import type { HonoEnv } from "./env";
import { handleError } from "./http/errorHandler";
import { diMiddleware } from "./middleware/di";
import { rateLimitBy } from "./middleware/rateLimit";
import { mergeAuthOpenApiDocument, openApiDocument } from "./openapi";
import { handleAiJobsBatch } from "./queue/aiJobs";
import { registerApiRoutes } from "./routes";
import { SCALAR_CDN_URL } from "./scalar-asset";

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
	if (isLocalURL(c.req.url) && isLocalURL(origin)) return true;
	const allowed = (c.env.ALLOWED_ORIGINS ?? "")
		.split(",")
		.map((entry) => entry.trim())
		.filter(Boolean);
	return allowed.includes(origin);
}

function isLocalURL(value: string): boolean {
	try {
		const hostname = new URL(value).hostname;
		return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
	} catch {
		return false;
	}
}

/* WebSocket upgrade responses have immutable headers; middleware that mutates
   or hashes the response body must not touch them. */
const unlessWebSocket =
	(middleware: MiddlewareHandler<HonoEnv>): MiddlewareHandler<HonoEnv> =>
	(c, next) =>
		c.req.header("upgrade")?.toLowerCase() === "websocket" ? next() : middleware(c, next);

/* CSP for HTML pages (landing, share pages, and the SPA shell served by the
   assets binding). The /api stack keeps its own secureHeaders (JSON needs no
   CSP), and /docs is excluded because Scalar renders its own interactive HTML.
   In dev, Vite injects an inline react-refresh preamble and HMR
   talks over a same-host ws connection, hence the relaxations. */
const pageSecureHeaders = secureHeaders({
	contentSecurityPolicy: {
		defaultSrc: ["'self'"],
		scriptSrc: ["'self'"],
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
		allowHeaders: ["Content-Type"],
	}),
);
/* Blocks cross-origin form submissions that ride on the auth cookies. */
const csrfProtection = csrf({ origin: isAllowedOrigin });
app.use("/api/*", csrfProtection);
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
app.use(
	"/api/auth/*",
	rateLimitBy((env) => env.AUTH_RATE_LIMITER),
);
app.use(
	"/api/ai/jobs",
	rateLimitBy((env) => env.AI_RATE_LIMITER),
);

app.use("/api/*", diMiddleware);

/* Better Auth owns everything under /api/auth/* (sign-in, sign-up, verification,
   password reset, session listing/revocation). Mounted before the app routes so
   its handler terminates those requests. Documented at /api/auth/reference. */
app.all("/api/auth/*", (c) => createAuth(c.env).handler(c.req.raw));

/* Resolves the Better Auth session (cookie or Bearer) and the linked domain
   profile into the request context for the application routes. Skips /api/auth/*
   (handled above) so those requests never pay for the extra session lookup. */
app.use("/api/*", async (c, next) => {
	if (c.req.path.startsWith("/api/auth/")) return next();

	const session = await createAuth(c.env).api.getSession({ headers: c.req.raw.headers });
	c.set("authUser", session?.user ?? null);
	c.set("session", session?.session ?? null);
	c.set(
		"domainUser",
		session?.user
			? await c.get("container").repositories.users.getByAuthUserId(session.user.id)
			: null,
	);

	return next();
});

/* ------------------------------ documentation ------------------------------ */

app.openAPIRegistry.registerComponent("securitySchemes", "CookieAuth", {
	type: "apiKey",
	in: "cookie",
	name: "better-auth.session_token",
	description: "Better Auth session cookie set on sign-in (web app).",
});

const scalarDocs = Scalar({
	url: "/openapi.json",
	cdn: SCALAR_CDN_URL,
	pageTitle: "Istudarne API Reference",
	theme: "default",
});

app.get("/docs", scalarDocs);
app.get("/docs/", scalarDocs);
app.get("/api/docs", scalarDocs);
app.get("/api/docs/", scalarDocs);
app.get("/openapi.json", async (c) =>
	c.json(
		await mergeAuthOpenApiDocument(app.getOpenAPIDocument(openApiDocument), createAuth(c.env)),
	),
);
app.get("/api/openapi.json", async (c) =>
	c.json(
		await mergeAuthOpenApiDocument(app.getOpenAPIDocument(openApiDocument), createAuth(c.env)),
	),
);

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
- [API docs](${origin}/docs): interactive Scalar API Reference

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

registerApiRoutes(app);

/* This Worker is a pure JSON API. The landing page, shareable quiz pages and the
   SPA shell are served by apps/web (React Router SSR), so every non-API path is a
   real 404 here. */
app.notFound((c) => {
	if (new URL(c.req.url).pathname.startsWith("/api/")) {
		return c.json({ error: "Resource not found." }, 404);
	}
	return c.json({ error: "Not found. This host serves the Istudarne API only." }, 404);
});

export { StudyGroupChat };

/* The Worker exports both the HTTP entry point (Hono) and the queue consumer
   that processes async AI jobs. */
export default {
	fetch: app.fetch,
	queue: handleAiJobsBatch,
};
