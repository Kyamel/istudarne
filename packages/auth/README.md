# @istudarne/auth

Email/password auth for Hono/Workers apps, built as a thin, portable wrapper over
[Better Auth](https://better-auth.com). It carries the full feature set of the
hand-rolled `istudarne` / `visao-game` auth modules — register/login, email
verification (as a policy), password reset, session listing/revocation, a
new-device sign-in alert, and dual transport (httpOnly cookies +
`Authorization: Bearer`) — but with Better Auth owning the crypto and sessions.

## What changed from the hand-rolled modules

The old modules were stateless: HS256 JWT access tokens + opaque, rotating
refresh tokens with a reuse-leeway window, PBKDF2 by hand. **Better Auth uses
database-backed sessions**, so all of that is gone:

- No access/refresh token rotation, no `refreshReuseLeewaySeconds` race window —
  a session is a row, revoking it is immediate (not deferred to an access-token
  TTL). The two stateless-only policy knobs (`accessTokenTtlSeconds`,
  `refreshReuseLeewaySeconds`) were dropped; everything else survives.
- Password hashing, token hashing, and single-use verification/reset tokens are
  Better Auth's, not ours.
- Endpoints are Better Auth's **native paths** (`/api/auth/sign-up/email`,
  `/sign-in/email`, `/verify-email`, `/request-password-reset`,
  `/reset-password`, `/list-sessions`, …), not the old
  `/register` · `/login` · `/refresh` shape.

## Files

| File             | What                                                                              |
| ---------------- | -------------------------------------------------------------------------------- |
| `policy.ts`      | `AuthPolicy` — the knobs projects disagree on, plus `DEFAULT` / `OPTIONAL` presets. **Start here.** |
| `create-auth.ts` | `createAuth(config)` — translates the policy into a `betterAuth` instance + plugins. |
| `emails.ts`      | `AuthEmailSender` seam + `createConsoleEmailSender` (dev: logs the link).         |
| `device.ts`      | `describeDevice` / `sameDevice` for the new-device sign-in alert.                 |
| `index.ts`       | Public exports.                                                                  |

Plugins enabled: `bearer` (native/mobile transport), `multiSession`, and
`openAPI` (reference UI at `/api/auth/reference`).

## Usage

The host owns the two things every project does differently — the **database
adapter** and **email delivery** — and passes them in:

```ts
import { createAuth, DEFAULT_AUTH_POLICY, createConsoleEmailSender } from '@istudarne/auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { createDatabase, authUser, authSession, authAccount, authVerification, authRateLimit } from '@istudarne/database';

const db = createDatabase(env.DATABASE_URL);

export const auth = createAuth({
  baseURL: env.AUTH_BASE_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.PUBLIC_WEB_ORIGIN],
  policy: DEFAULT_AUTH_POLICY,          // or OPTIONAL_VERIFICATION_POLICY, or your own
  emails: createConsoleEmailSender(),   // swap for a real sender in prod
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: authUser,
      session: authSession,
      account: authAccount,
      verification: authVerification,
      rateLimit: authRateLimit
    }
  }),
  socialProviders: env.GITHUB_CLIENT_ID
    ? { github: { clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET } }
    : undefined
});
```

Mount it and resolve the session in the host (Hono example — see
`apps/api/src/index.ts`):

```ts
app.all('/api/auth/*', (c) => auth.handler(c.req.raw));

app.use('/v1/*', async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  c.set('user', session?.user ?? null);
  c.set('session', session?.session ?? null);
  return next();
});
```

`getSession` accepts both transports: the httpOnly cookie **and**
`Authorization: Bearer <token>` (the token is returned in the `set-auth-token`
response header on sign-in).

## The policy

`AuthPolicy` is the whole portable configuration surface. Each knob maps onto a
Better Auth option (see `create-auth.ts`):

| Knob                          | Better Auth option                                     |
| ----------------------------- | ------------------------------------------------------ |
| `emailVerification`           | `emailAndPassword.requireEmailVerification` (`required-for-login` → true) |
| `sessionTtlSeconds`           | `session.expiresIn`                                    |
| `sessionUpdateAgeSeconds`     | `session.updateAge` (sliding refresh)                  |
| `emailVerificationTtlSeconds` | `emailVerification.expiresIn`                          |
| `passwordResetTtlSeconds`     | `emailAndPassword.resetPasswordTokenExpiresIn`         |
| `resendCooldownSeconds`       | rate-limit rule on `/send-verification-email` and `/request-password-reset` |
| `maxFailedLoginAttempts` / `failedLoginWindowSeconds` | rate-limit rule on `/sign-in/email`    |

- `DEFAULT_AUTH_POLICY` — istudarne behaviour: **verification required before
  login**, 30-day sessions.
- `OPTIONAL_VERIFICATION_POLICY` — visao-game behaviour: login works
  immediately; verification only gates features you choose to gate.

## Porting to another project (istudarne / visao-game)

The core is project-agnostic. To adopt it in another repo you change exactly
three things:

1. **Database adapter** — build the right `drizzleAdapter` (or any Better Auth
   adapter) over that project's schema and pass it as `database`. Mirror
   `packages/database`'s Better Auth tables (`user`, `session`, `account`,
   `verification`, `rate_limit`) or generate equivalent tables with
   `npx @better-auth/cli generate`.
2. **Email delivery** — implement `AuthEmailSender` over that project's provider
   (Resend, Cloudflare Email, …). `createConsoleEmailSender` is the dev double.
3. **Policy + social providers** — pick a preset or hand-roll an `AuthPolicy`,
   and pass `socialProviders` if the project uses OAuth.

Everything else — the flows, the plugins, the new-device alert — comes for free.

## Local dev gotcha (workerd + Neon TLS)

Cloudflare's prebuilt `workerd` can't find the system CA bundle on NixOS, so
`wrangler dev` fails TLS to Neon with *"unable to get local issuer certificate"*.
The host app fixes this by pointing `SSL_CERT_FILE` at the system bundle — see
`apps/api/scripts/dev.sh`. Any local wrangler app that talks to Neon needs the
same.
