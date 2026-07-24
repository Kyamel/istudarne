# @mhentai/auth Agent Guide

Portable wrapper over Better Auth carrying the feature set of the hand-rolled
`istudarne` / `visao-game` auth modules. Read `README.md` first -- it has the
usage, the policy->Better Auth mapping, and the port guide.

Also read:

- `../../AGENTS.md` for global context.
- `../../apps/api/AGENTS.md` -- the reference host; wires this package at `/api/auth/*`.
- `../database/AGENTS.md` when a change touches the auth tables.

## Responsibility

- Build a Better Auth instance from an `AuthPolicy` (`createAuth`).
- Own the portable seams: the policy, the `AuthEmailSender`, device parsing.
- Stay free of any ORM/DB and framework dependency -- the host passes the
  database adapter and the email sender in.

## Important Files

- `src/policy.ts`: `AuthPolicy` + `DEFAULT_AUTH_POLICY` / `OPTIONAL_VERIFICATION_POLICY`.
- `src/create-auth.ts`: `createAuth(config)` -- the whole translation to `betterAuth`.
- `src/emails.ts`: `AuthEmailSender` seam + `createConsoleEmailSender`.
- `src/device.ts`: `describeDevice` / `sameDevice` for the new-device alert.

## Design rules

- **Stateful sessions, not stateless tokens.** No JWT/refresh rotation or reuse
  leeway -- sessions are DB rows, revocation is immediate. Don't reintroduce the
  old stateless knobs.
- **Native Better Auth paths** (`/sign-up/email`, `/sign-in/email`,
  `/request-password-reset`, `/list-sessions`, ...). If you add a rate-limit
  `customRule`, its key must match the real endpoint path.
- **Keep the package host-agnostic.** New DB or email needs go through the
  `database` adapter and `AuthEmailSender`, never a direct import.
- Every Better Auth model needs an `id` PK in the Drizzle schema (including
  `rate_limit`); `rate_limit.last_request` must be a bigint.

## Commands

```bash
pnpm --filter @mhentai/auth check
```

## Notes

- Adding a plugin or a `user.additionalFields` entry is a schema change -- update
  `packages/database` and a migration together, or login breaks. Keep mhentai
  profile fields in the host domain schema unless they are truly required for
  authentication.
- Email is a policy-free seam: the service returns nothing to send; delivery and
  copy are the host's job.
- Validate through the real worker, not only unit-level: the HTTP path surfaced
  the `rate_limit` schema and TLS issues that in-process tests missed.
