# Mobile (Capacitor) readiness

A Capacitor Android app is planned. It will reuse the React SPA as its WebView
UI and talk to the deployed Worker API over HTTPS. The codebase is already
prepared for that:

## Clean API boundary

- `worker/` never imports from `app/` — the API is a standalone product.
  Both sides share only `shared/contracts` (Zod schemas) and
  `shared/paraglide` (i18n). See [architecture.md](architecture.md).
- The full API surface is described by `/openapi.json`, so a native client
  could also be generated instead of reusing the SPA.

## Configurable API base

`app/lib/api.ts` prefixes every request with `VITE_API_BASE` (empty for the
web build, where the API is same-origin). For the Capacitor build:

```bash
VITE_API_BASE=https://istudarne.<account>.workers.dev npm run build
```

`groupChatUrl()` derives the WebSocket URL (ws/wss) from the same base.

CORS already reflects the caller origin with credentials
(`worker/index.ts`), which covers `capacitor://localhost` /
`https://localhost` WebView origins.

## Known gap: session cookie SameSite

Sessions use an HTTP-only cookie with `SameSite=Lax`
(`worker/http/cookies.ts`). Cross-origin requests from the Capacitor WebView
will not carry it. Before shipping the app, pick one:

1. Set `SameSite=None; Secure` when the request comes from an allowed mobile
   origin, or
2. add a bearer-token variant of the session (same `sessions` table, token in
   the `Authorization` header) following the architecture recipe.

Option 2 is cleaner and also serves third-party API consumers.

## UI

- `viewport-fit=cover` plus `env(safe-area-inset-*)` paddings in the app
  shell (topbar, drawer, main) keep content clear of notches and gesture
  bars.
- The shell is mobile-first: off-canvas navigation drawer under 900px
  (`desktop:` breakpoint), touch targets ≥40px, responsive grids.
- Theme follows tokens; `theme-color` meta is set for the Android status bar.
