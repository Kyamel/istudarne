# auth — self-contained Hono auth module

Email/password auth for Hono APIs (Cloudflare Workers or any runtime with Web
Crypto): 15-min HS256 JWT access tokens, opaque rotating refresh tokens
(SHA-256-hashed, reuse detection revokes all sessions), required email
verification via Resend (console fallback in dev, 60 s resend cooldown), and
dual transport — httpOnly cookies for web SPAs, `Authorization: Bearer` for
native apps. All endpoints are `@hono/zod-openapi` routes, so they show up in
Swagger and in an `hc` RPC client.

Pairs with the client module in `app/auth/` (React AuthProvider + fetch client).

## Files

| File | What |
| --- | --- |
| `contracts.ts` | zod schemas + `AuthUser` — **adapt the profile fields per project** |
| `store.ts` | `AuthStore` interface — implement it over your DB/ORM (the only persistence work) |
| `service.ts` | business logic (register/login/refresh/logout/verify/resend) |
| `routes.ts` | OpenAPI route defs + `createAuthApi(deps)` handler factory |
| `middleware.ts` | `createAuthMiddleware(getAuth)` — resolves Bearer/cookie into `c.var.user` |
| `cookies.ts` | httpOnly cookie transport (rename the cookie prefix per project) |
| `jwt.ts`, `crypto.ts` | HS256 tokens, PBKDF2 passwords, opaque tokens (Web Crypto only) |
| `email.ts` | Resend client with dev console fallback |

Dependencies: `hono`, `zod`, `@hono/zod-openapi`. Errors are thrown as Hono
`HTTPException` — map them to your JSON error shape in `app.onError`.

## Integration (5 steps)

1. **Tables**: users need `email` (unique), `password_hash`, `email_verified_at`
   plus your profile fields; add `refresh_tokens` and
   `email_verification_tokens` (id, user_id, token_hash unique, expires_at,
   plus `revoked_at`/`replaced_by_id` for refresh, `used_at` for verification).
2. **Store**: implement `AuthStore` (see `store.ts`) over those tables.
3. **Services** (per request, e.g. in a DI middleware):
   ```ts
   const auth = createAuthService(store, env.JWT_SECRET);
   const email = createEmailService({ apiKey: env.RESEND_API_KEY, from: env.EMAIL_FROM });
   ```
4. **Middleware + routes**:
   ```ts
   app.use("/api/*", createAuthMiddleware<MyEnv>((c) => getAuth(c)));
   const authApi = createAuthApi<MyEnv>({ auth: getAuth, email: getEmail });
   app
     .openapi(authApi.registerRoute, authApi.registerHandler)
     .openapi(authApi.loginRoute, authApi.loginHandler)
     .openapi(authApi.refreshRoute, authApi.refreshHandler)
     .openapi(authApi.logoutRoute, authApi.logoutHandler)
     .openapi(authApi.meRoute, authApi.meHandler)
     .openapi(authApi.verifyEmailLinkRoute, authApi.verifyEmailLinkHandler)
     .openapi(authApi.verifyEmailRoute, authApi.verifyEmailHandler)
     .openapi(authApi.resendVerificationRoute, authApi.resendVerificationHandler);
   ```
   `MyEnv` must include `Variables: { user: AuthUser | null }` (`WithAuthUser`).
   For Swagger, register the security schemes once:
   ```ts
   app.openAPIRegistry.registerComponent("securitySchemes", "BearerAuth",
     { type: "http", scheme: "bearer", bearerFormat: "JWT" });
   app.openAPIRegistry.registerComponent("securitySchemes", "CookieAuth",
     { type: "apiKey", in: "cookie", name: ACCESS_COOKIE_NAME });
   ```
5. **Hardening around the module** (recommended): rate-limit
   `/api/auth/login|register|refresh|verify-email|resend-verification`; CSRF
   middleware for cookie clients (skip when an `Authorization` header is
   present); CORS allowlist with `credentials: true`.

## What to adapt when copying

- `contracts.ts`: profile fields in `currentUserSchema`/`registerRequestSchema`.
- `cookies.ts`: cookie name prefix; refresh path if not mounted at `/api/auth`.
- `email.ts`: sender copywriting; swap Resend for another provider if needed.
- Routes are mounted at `/api/auth/*` by path string — change in `routes.ts`
  if your API lives elsewhere (also update `verificationUrl`).
