/**
 * Auth module -- builds a Better Auth instance from an `AuthPolicy`.
 *
 * This is the whole port of the hand-rolled `istudarne` / `visao-game` auth
 * modules: register/login, email verification (as a policy), password reset,
 * session listing/revocation, and a new-device sign-in alert. Where the old
 * modules hand-rolled JWTs, opaque refresh-token rotation and PBKDF2, Better
 * Auth now owns all of it with stateful, immediately-revocable sessions.
 *
 * The host stays in charge of the two things every project does differently:
 * the database adapter (passed in, so this package never imports an ORM) and
 * email delivery (the `AuthEmailSender`).
 */
import { betterAuth, type BetterAuthOptions } from 'better-auth/minimal';
import { openAPI } from 'better-auth/plugins';

import { describeDevice, sameDevice } from './device';
import type { AuthEmailSender } from './emails';
import { type AuthPolicy, DEFAULT_AUTH_POLICY } from './policy';

export type CreateAuthConfig = {
  /**
   * A Better Auth database adapter, e.g. `drizzleAdapter(db, { provider, schema })`.
   * Built by the host so this package stays free of any ORM dependency.
   */
  database: BetterAuthOptions['database'];
  secret: string;
  baseURL: string;
  basePath?: BetterAuthOptions['basePath'];
  trustedOrigins?: string[];
  policy?: AuthPolicy;
  emails: AuthEmailSender;
  socialProviders?: BetterAuthOptions['socialProviders'];
  /** Host-owned hooks, e.g. provisioning a domain profile after auth user creation. */
  databaseHooks?: BetterAuthOptions['databaseHooks'];
  /** Extra plugins appended after the module's own set. */
  plugins?: NonNullable<BetterAuthOptions['plugins']>;
};

export type Auth = ReturnType<typeof createAuth>;

export function createAuth(config: CreateAuthConfig) {
  const policy = config.policy ?? DEFAULT_AUTH_POLICY;

  return betterAuth({
    baseURL: config.baseURL,
    basePath: config.basePath ?? '/api/auth',
    secret: config.secret,
    trustedOrigins: config.trustedOrigins,
    database: config.database,

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: policy.emailVerification === 'required-for-login',
      resetPasswordTokenExpiresIn: policy.passwordResetTtlSeconds,
      // A password reset means the old one leaked; drop every live session.
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url, token }) => {
        await config.emails.sendPasswordReset({ to: user.email, url, token });
      }
    },

    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: false,
      expiresIn: policy.emailVerificationTtlSeconds,
      sendVerificationEmail: async ({ user, url, token }) => {
        await config.emails.sendVerification({ to: user.email, url, token });
      }
    },

    session: {
      expiresIn: policy.sessionTtlSeconds,
      updateAge: policy.sessionUpdateAgeSeconds
    },

    rateLimit: {
      enabled: true,
      // Workers are stateless per request, so counters must live in the DB.
      storage: 'database',
      window: policy.failedLoginWindowSeconds,
      max: 100,
      customRules: {
        '/sign-in/email': {
          window: policy.failedLoginWindowSeconds,
          max: policy.maxFailedLoginAttempts
        },
        // Resend cooldown: at most one verification/reset email per window.
        '/send-verification-email': { window: policy.resendCooldownSeconds, max: 1 },
        '/request-password-reset': { window: policy.resendCooldownSeconds, max: 1 }
      }
    },

    // Cloudflare sets `cf-connecting-ip` at the edge and overwrites any
    // client-supplied value, so it is the only trustworthy client IP here.
    // Deliberately NOT listing `x-forwarded-for`: it is caller-settable and
    // would let anyone forge an address to evade rate limiting.
    advanced: {
      ipAddress: {
        ipAddressHeaders: ['cf-connecting-ip']
      }
    },

    databaseHooks: {
      ...config.databaseHooks,
      session: {
        ...config.databaseHooks?.session,
        create: {
          ...config.databaseHooks?.session?.create,
          // New-device sign-in alert: fire when this account already has a
          // session but none from a matching user-agent. Best-effort -- a failure
          // here must never block the sign-in.
          after: async (session, ctx) => {
            if (ctx) {
              try {
                const sessions = await ctx.context.internalAdapter.listSessions(session.userId);
                const others = sessions.filter((s) => s.id !== session.id);
                const knownDevice = others.some((s) => sameDevice(s.userAgent, session.userAgent));

                if (others.length > 0 && !knownDevice) {
                  const user = await ctx.context.internalAdapter.findUserById(session.userId);

                  if (user?.email) {
                    await config.emails.sendNewDeviceAlert({
                      to: user.email,
                      device: describeDevice(session.userAgent),
                      ipAddress: session.ipAddress
                    });
                  }
                }
              } catch (error) {
                console.error(
                  JSON.stringify({ event: 'auth.new_device_alert_failed', error: String(error) })
                );
              }
            }

            await config.databaseHooks?.session?.create?.after?.(session, ctx);
          }
        }
      }
    },

    socialProviders: config.socialProviders,

    plugins: [
      // Generates the OpenAPI schema merged into the API's unified Scalar docs
      // at /docs. The plugin's own standalone Scalar page (/reference) is
      // disabled to keep a single documentation surface.
      openAPI({ disableDefaultReference: true }),
      ...(config.plugins ?? [])
    ]
  });
}
