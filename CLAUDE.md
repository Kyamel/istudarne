# Istudarne

Gamified quiz-based study platform: users import JSON question banks, answer
quizzes, track progress, share public quizzes, and chat in study groups.
Everything (SPA + API) ships as a single Cloudflare Worker.

## Stack

- **Runtime**: Cloudflare Workers (`wrangler.jsonc`), Vite + `@cloudflare/vite-plugin` for dev/build.
- **API**: Hono via `@hono/zod-openapi` (OpenAPI 3.1 + Swagger UI at `/docs`, spec at `/openapi.json`).
- **Frontend**: React 19 + react-router in `app/`, Tailwind v4 (classes inline in components), i18n via Paraglide (`messages/en.json`, `messages/pt-br.json` → run `npm run i18n:compile` after editing).
- **Data**: D1 (Drizzle ORM, schema in `worker/server/db/schema/`), R2 (`QUIZ_FILES`) for JSON objects, Durable Object `StudyGroupChat` for group chat WebSockets, Cloudflare Queue `istudarne-ai-jobs` for async AI jobs.
- **Validation**: Zod v4 schemas shared between client and server in `shared/contracts/`.

## Commands

- `npm run dev` — Vite dev server (Worker + SPA, local D1/R2/Queues via miniflare; secrets from `.dev.vars`, see `.dev.vars.example`).
- `npm run typecheck` — compiles i18n then `tsc --noEmit`. `npm run lint` / `npm run check` — Biome (tabs, double quotes, 100 cols).
- `npm run db:generate` — Drizzle migration from schema diff (interactive; if it needs a TTY answer about renames, add/remove tables in two steps so each diff is pure additions or pure drops).
- `npm run db:migrate:local` / `db:migrate:remote` — apply D1 migrations.
- `npm run rpc:types` — emits flattened declarations of `worker/routes` into `.rpc/` (gitignored); the `@api/routes` alias resolves there so IDE autocomplete on the RPC client is fast (sub-second) instead of re-inferring the whole zod-openapi chain (~10 s per keystroke). Runs automatically before `dev` and `typecheck`; after editing routes, rerun it (or keep `npm run rpc:types:watch` running) so `ApiRoutes` stays fresh.
- `worker-configuration.d.ts` is generated (the Cloudflare Vite plugin regenerates it on dev/build; `npx wrangler types` also works). Never hand-edit `Env`; the file is excluded from Biome.

## Architecture (worker/)

Request path: `index.ts` (middleware stack) → route handler → service → repository → query.

- `worker/index.ts` — middleware (requestId, logger, CORS allowlist via `ALLOWED_ORIGINS` var, CSRF for cookie clients — skipped when an `Authorization` header is present, secureHeaders, etag, prettyJSON, bodyLimit 5 MB, rate limiters, DI, auth). Middleware that touches response headers/body is wrapped in `unlessWebSocket` so the chat upgrade (101) passes through. Default export is `{ fetch, queue }` — the Worker is also the queue consumer.
- `worker/routes/**` — **one file per endpoint**, exporting a `createRoute` definition + a `RouteHandler`-typed handler. `routes/index.ts` chains every `.openapi(route, handler)` call and exports `type ApiRoutes`; that type powers the RPC client in `app/lib/rpc.ts` (`hc<ApiRoutes>`). New endpoints MUST be added to the chain (keeps Swagger and RPC complete) and specific paths must be registered before parametric ones.
- `worker/server/` — framework-free domain code: `services/` (business logic), `repositories/` (one object per aggregate), `queries/` (one file per query), `container.ts` (per-request DI, built once in `middleware/di.ts`).
- Errors: throw `AppError` (`worker/server/errors.ts`); `http/errorHandler.ts` maps `AppError` and Hono `HTTPException` to `{ error }` JSON. Zod validation failures use the same shape via the `defaultHook` in `index.ts`.
- `shared/contracts/` — Zod schemas + types used by route definitions, the frontend `api.ts` wrapper, and the RPC client.

## Web vs native builds (one Worker, two deploys)

`app/lib/rpc.ts` imports `type ApiRoutes` via the `@api/*` alias (→ `worker/*`). This is a **type-only** dependency: `verbatimModuleSyntax` guarantees it is erased at build, so the client bundle ships zero worker code. The two deploy targets come from the same repo/Worker:

- **Web**: `npm run deploy` — the Worker serves both the API and `dist/client` as static assets.
- **Native (Capacitor)**: `VITE_API_BASE=https://<worker-url> npm run build`, then wrap `dist/client`; the app talks to the deployed Worker over HTTP with Bearer auth (add its origin to `ALLOWED_ORIGINS`).

Do NOT split the project to "decouple" app from worker — the type coupling is the point (contract changes fail the app at compile time), and there is no runtime coupling.

## Auth model

- **Access token**: 15-min JWT (HS256, `JWT_SECRET` secret) — `worker/server/auth/jwt.ts`.
- **Refresh token**: opaque, SHA-256-hashed in `refresh_tokens` (30 days), **rotated on every refresh**; reusing a rotated token revokes all of the user's sessions (`authService.refresh`).
- **Two transports**: web app uses httpOnly cookies (`istudarne_access` on `/`, `istudarne_refresh` scoped to `/api/auth`); native apps use `Authorization: Bearer` and receive tokens in the login/refresh JSON body. `middleware/auth.ts` resolves both.
- **Email verification is required before login** (403 otherwise). Register issues no tokens; Resend sends the link (`services/emailService.ts`). Without `RESEND_API_KEY` (dev), the magic link is logged to the console as `event: "email.verification_link"`. `POST /api/auth/resend-verification` is unauthenticated by email and always answers ok (no account enumeration).
- The web client auto-refreshes on 401 (`app/lib/api.ts`).
- OAuth2 (Google) is prepared but not implemented: `users.google_id` + `email_verified_at` columns exist; a future flow should create/link the user then reuse `issueTokens`.

## AI jobs (Queues)

`POST /api/ai/jobs` stores the payload in R2 (`ai/jobs/{id}/input.json`), inserts an `ai_jobs` row, enqueues `{ jobId }`, and returns 202; clients poll `GET /api/ai/jobs/{jobId}`. The consumer (`worker/queue/aiJobs.ts`) calls OpenAI (`OPENAI_API_KEY`, model from `OPENAI_MODEL` var) and writes the result to R2. Waiting on OpenAI is I/O and does not count against the Workers CPU budget — the queue exists so user requests never block on it, plus free retries. `MAX_ATTEMPTS` in the consumer must stay in sync with `max_retries` in `wrangler.jsonc`.

## Rate limiting

Cloudflare `ratelimits` bindings (`AUTH_RATE_LIMITER` 10/min, `AI_RATE_LIMITER` 5/min), applied per IP + path in `middleware/rateLimit.ts` to the auth endpoints and AI job creation. Returns 429 JSON.

## Conventions

- Code, comments, docs, commit messages: **English only** (UI strings go through Paraglide i18n).
- Tailwind classes stay inside components; merge them with `cx()` (`app/lib/classes.ts`, clsx + tailwind-merge).
- API stays RAG-friendly: OpenAPI spec, `/llms.txt`, Markdown quiz export (`/api/quizzes/:id/export?format=markdown`).

## Deploy checklist

1. Secrets: `wrangler secret put JWT_SECRET` (required), `RESEND_API_KEY`, `OPENAI_API_KEY`.
2. `wrangler queues create istudarne-ai-jobs` (Queues needs the Workers Paid plan).
3. `npm run db:migrate:remote`; real D1 `database_id` in `wrangler.jsonc`.
4. Verified sender domain in Resend for `EMAIL_FROM`; native-app origins in `ALLOWED_ORIGINS`.
