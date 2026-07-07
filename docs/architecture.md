# Architecture

Istudarne is a single Cloudflare Worker that serves three things:

1. **Server-rendered pages** — the landing page (`/`), quiz share pages
   (`/share/quizzes/:id`) and the 404 page, rendered in the Worker for SEO and
   link embeds (see [seo-ssr.md](seo-ssr.md)).
2. **A JSON API** (`/api/*`) built with Hono + zod-openapi, backed by D1
   (Drizzle ORM), R2 (original quiz files) and Durable Objects (group chat).
3. **The React SPA** (`/app/*`), static assets served by the Workers assets
   binding with SPA fallback.

## Separation: worker ⇄ shared ⇄ app

The backend and the frontend are fully independent — neither imports from the
other. Both depend only on `shared/`. This keeps the Worker API consumable by
other clients (e.g. the planned Capacitor Android app, see
[mobile.md](mobile.md)).

Path aliases (tsconfig + Vite): `@shared/*` → `shared/*`, `@server/*` →
`worker/server/*`, `~/*` → `app/*`.

```text
shared/                     code both sides may import
├─ contracts/               Zod schemas + types (single source of truth)
└─ paraglide/               generated i18n messages (SPA UI + SSR pages)

worker/                     backend — never imports from app/
├─ index.ts                 bootstrap, SSR pages, llms.txt, 404 handling
├─ html.ts                  server-rendered page templates
├─ openapi.ts               OpenAPI document
├─ http/                    cookies, error handler, request context helpers
├─ middleware/di.ts         builds the DI container per request
├─ routes/<domain>/<verb>.ts  one route per file, thin handlers only
└─ server/                  domain layer
   ├─ container.ts          DI container (db + repositories + services)
   ├─ db/schema/            Drizzle table definitions
   ├─ queries/<domain>/     one pure query function per file
   ├─ repositories/         group queries into a domain interface
   ├─ services/             business rules, authorization, orchestration
   └─ study-group-chat.ts   Durable Object for realtime chat

app/                        frontend — talks to the worker only via HTTP
├─ components/              base library in four categories (see below)
│  ├─ containers/           layout and grouping surfaces
│  ├─ navigation/           moving around the app
│  ├─ controls/             inputs and actions
│  └─ feedback/             status, identity and information display
├─ pages/                   screens composed only from base components
└─ lib/                     api client, auth context, i18n helpers, cx()
```

## Style: functional, composition over inheritance

There are no classes (besides the Durable Object, which the platform requires).
Every layer is a factory function returning a plain object of functions:
`createQuizRepository(db)`, `createQuizService(repo, storage)`. Dependencies
are passed as arguments, wired once per request in `container.ts`.

## The recipe: adding a new feature

Adding an endpoint + screen is a fill-in-the-blanks exercise. Example for a
hypothetical "favorites" feature:

1. **Contract** — `shared/contracts/favorites.ts`: request/response Zod
   schemas + inferred types. Re-export from `shared/contracts/index.ts`.
2. **Schema** — add the table in `worker/server/db/schema/`, then
   `npm run db:generate` and `npm run db:migrate:local`.
3. **Queries** — `worker/server/queries/favorites/addFavorite.ts` etc. One
   pure `(db, args) => result` function per file.
4. **Repository** — `worker/server/repositories/favoriteRepository.ts`
   grouping the queries; register it in `repositories/index.ts`.
5. **Service** — `worker/server/services/favoriteService.ts` with the
   business rules (authorization, validation, points…); register it in
   `container.ts`.
6. **Route** — `worker/routes/favorites/add.ts` exporting
   `registerAddFavorite(app)`; the handler only parses input (contract),
   calls the service and shapes the response. Register it in
   `worker/routes/index.ts` (specific paths before parametric ones).
7. **API client** — add a typed function in `app/lib/api.ts` that validates
   the response against the contract.
8. **UI** — compose the screen in `app/pages/` from base components; create a
   new base component (in the right category folder) only if a visual
   pattern repeats or carries meaning.

Errors: services throw `HttpError` (see `worker/server/errors.ts`); the
global `handleError` maps them to JSON responses.

## Conventions

- All code, comments and commit messages in English. User-facing strings go
  through Paraglide i18n (`messages/en.json`, `messages/pt-br.json`).
- Validation happens twice: in the SPA before sending (same contract) and in
  the Worker on arrival. Contracts are the single source of truth.
- Sessions are HTTP-only cookies; route handlers get the user via
  `currentUser(c)` and never touch cookies directly.
- The SPA reaches the API through `app/lib/api.ts` only; the base URL is
  configurable via `VITE_API_BASE` for non-web clients.
