# auth — self-contained React client for the Hono auth module

Client half of `worker/auth/`: a plain-fetch API client plus a React
`AuthProvider`/`useAuth` context. No dependency on the app's RPC client or UI
kit — copy the folder into any React SPA that talks to the same endpoints.

## Files

| File | What |
| --- | --- |
| `client.ts` | fetch calls (register/login/logout/me/verify/resend), `AuthError`, `tryRefresh`, and `fetchWithRefresh` — a drop-in `fetch` wrapper that silently rotates the session once on 401 |
| `context.tsx` | `AuthProvider` (boots via `/api/auth/me`, refreshing once if expired) and `useAuth()` exposing `user`, `loading`, `login`, `register`, `logout`, `resendVerification` |

Types (`CurrentUser`, requests) are imported **type-only** from the server
module's `contracts.ts` — erased at build, so no server code reaches the
bundle. In a separate-repo setup, copy the types into `client.ts` instead.

## Integration

1. Wrap the app: `<AuthProvider>…</AuthProvider>`; gate routes with
   `useAuth().user` / `.loading`.
2. Point your general API client at `fetchWithRefresh` so every endpoint gets
   the transparent 401→refresh→retry behavior (see `app/lib/rpc.ts` here).
3. Login screen specifics: `login()` throws `AuthError` — `status === 403`
   means "email not verified", the cue to offer `resendVerification(email)`
   (server enforces a 60 s cooldown; mirror it with a client countdown).
4. Cross-origin API (e.g. Capacitor): set `VITE_API_BASE`; cookies require the
   server's CORS allowlist + `credentials: true`.

## What to adapt when copying

- `VITE_API_BASE` env name if your bundler differs (SvelteKit: use
  `PUBLIC_API_BASE` via `$env/static/public`; `client.ts` is framework-free —
  only `context.tsx` is React-specific, replace it with a store/runes wrapper).
- The registration input fields (mirror the server `contracts.ts`).
