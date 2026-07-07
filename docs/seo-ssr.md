# SEO and server-side rendering

Only the public, shareable surface is server-rendered; the authenticated app
stays a SPA. All SSR templates live in `worker/html.ts` and are plain
functions returning HTML strings — no framework, zero client JS, styles
inlined (mirroring the design tokens, honoring `prefers-color-scheme`).

## Landing page — `GET /`

- Localized via `Accept-Language` (pt-BR default, English fallback).
- `<title>`, meta description, canonical URL, Open Graph + Twitter tags.
- JSON-LD `WebApplication` schema.

## Share pages — `GET /share/quizzes/:id`

Purpose: quiz links pasted into chats/social networks unfurl with real
metadata, and search engines can index public quizzes.

- Serves only `public` and `unlisted` quizzes (single SQL lookup with author
  join); anything else renders the 404 page.
- Open Graph + Twitter cards with the quiz title/description, canonical URL.
- JSON-LD `Quiz` schema with `numberOfQuestions` and author.
- `unlisted` quizzes get `<meta name="robots" content="noindex">` — reachable
  by link, invisible to crawlers. The 404 page is also `noindex`.
- Call-to-action buttons deep-link into the SPA (`/app/quizzes/:id/play`).

## Routing rules (worker/index.ts)

- `/api/*` → JSON API (unknown API paths return JSON 404).
- `/`, `/share/*` → SSR pages.
- `/app`, `/app/*` → assets binding with SPA fallback
  (`not_found_handling: "single-page-application"` in `wrangler.jsonc`).
- Unknown top-level HTML navigation → SSR 404 page.

Adding a new embeddable page: add a renderer in `worker/html.ts`, a route in
`worker/index.ts`, and keep the pattern — escape all user content with
`escapeHtml`, set canonical + OG tags, decide indexability explicitly.
