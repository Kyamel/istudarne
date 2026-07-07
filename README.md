# Istudarne

Gamified, quiz-based study platform running entirely on Cloudflare Workers.

- `app/` + `worker/`: React SPA + Hono API deployed as a single Worker.
- `mvp/`: the original static HTML/JS prototype (kept for reference, published
  via GitHub Pages).

## Architecture

```text
worker/                   backend (Hono) — independent from app/
├─ /                      server-rendered landing page (SEO, JSON-LD)
├─ /share/quizzes/:id     server-rendered share pages for link embeds
├─ /llms.txt              entry point for AI agents / RAG pipelines
├─ /docs + /openapi.json  Swagger UI + OpenAPI spec generated from code
├─ /api/*                 JSON API (contracts validated with Zod)
└─ server/                D1 + Drizzle, R2, Durable Objects, services

shared/                   the only code both sides import
├─ contracts/             Zod schemas + types
└─ paraglide/             generated i18n messages

app/                      React SPA (/app/*) — talks to worker via HTTP only
├─ components/            base components in 4 categories (containers,
│                         navigation, controls, feedback) — all styling here
├─ pages/                 screens composed from base components
└─ lib/                   typed API client (VITE_API_BASE aware), auth, i18n
```

Full documentation lives in [docs/](docs/README.md): architecture recipe,
design system (Obsidian-like theme), SSR/SEO, and AI/RAG integration.

## Local development

```bash
npm install
npm run db:migrate:local   # create the local D1 database
npm run dev                # Vite + Workers runtime
```

Useful scripts: `npm run typecheck`, `npm run check` (Biome lint + format),
`npm run build`, `npm run deploy` (see [DEPLOY_CLOUDFLARE.md](DEPLOY_CLOUDFLARE.md)).

## Status

Implemented: auth with HTTP-only session cookies, JSON quiz upload (R2 + D1),
quiz player with persisted attempts/answers, stats dashboard, public search,
profiles with follow, groups with realtime chat, publish/unpublish, i18n
(pt-BR/en), light/dark themes, command palette (Ctrl/Cmd+K).

Next (see [APP_GAMIFICADO_SERVERLESS.md](APP_GAMIFICADO_SERVERLESS.md)):
achievements and leaderboards, tag-based search filters, password recovery,
semantic search with Vectorize, audio rooms.
