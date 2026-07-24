# auth — React client for Better Auth

Client half of `@istudarne/auth` as mounted by `apps/api` at `/api/auth/*`.
It uses Better Auth's native endpoints and exposes the app-facing domain user
from `GET /api/me`.

## Files

| File | What |
| --- | --- |
| `client.ts` | Better Auth React client, `AuthError`, login/register/logout/verification helpers, `/api/me` lookup, and `fetchWithAuth` for API calls. |
| `context.tsx` | `AuthProvider` and `useAuth()` exposing `user`, `loading`, `login`, `register`, `logout`, and `resendVerification`. |

## Integration

1. Wrap the app with `<AuthProvider>`.
2. Gate private routes with `useAuth().loading` and `useAuth().user`.
3. Use `fetchWithAuth` in the Hono RPC client so app endpoints receive the same
   auth transport as Better Auth.
4. Web uses Better Auth's httpOnly session cookie. Capacitor/native builds can
   set `VITE_API_BASE` to call the deployed API origin.

Registration posts to `/api/auth/sign-up/email`; login posts to
`/api/auth/sign-in/email`; logout posts to `/api/auth/sign-out`; the current app
profile is loaded from `/api/me`.
