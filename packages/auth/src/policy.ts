/**
 * Auth module — the knobs a host project is expected to disagree on.
 *
 * Ported from the hand-rolled `istudarne` / `visao-game` auth modules, but
 * retargeted at Better Auth's **stateful** session model. Two knobs from the old
 * stateless design are gone because they no longer describe anything:
 *
 * - `accessTokenTtlSeconds` — there is no stateless access token to expire.
 *   Sessions live in the database, so revocation is immediate, not deferred to
 *   the next access-token expiry.
 * - `refreshReuseLeewaySeconds` — there is no opaque refresh token to rotate,
 *   so no racing-replay window to forgive.
 *
 * Everything else maps onto a Better Auth option (see `create-auth.ts`).
 */

export type EmailVerificationPolicy =
	/** Login is refused until the address is verified (istudarne default). */
	| "required-for-login"
	/** Login works immediately; verification only gates features (visao-game). */
	| "optional";

export type AuthPolicy = {
	emailVerification: EmailVerificationPolicy;

	/** Session lifetime → Better Auth `session.expiresIn`. */
	sessionTtlSeconds: number;
	/** Sliding-refresh cadence: how often an active session's expiry is pushed
	 *  forward → Better Auth `session.updateAge`. */
	sessionUpdateAgeSeconds: number;

	/** Single-use email-verification link lifetime → `emailVerification.expiresIn`. */
	emailVerificationTtlSeconds: number;
	/** Single-use password-reset link lifetime → `emailAndPassword.resetPasswordTokenExpiresIn`. */
	passwordResetTtlSeconds: number;

	/** Server-side floor between verification/reset emails for one address,
	 *  enforced as a Better Auth rate-limit rule on those endpoints. */
	resendCooldownSeconds: number;

	/** Failed sign-ins for one window before the login endpoint is rate-limited. */
	maxFailedLoginAttempts: number;
	failedLoginWindowSeconds: number;
};

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** istudarne behaviour: verification required before login, 30-day sessions. */
export const DEFAULT_AUTH_POLICY: AuthPolicy = {
	emailVerification: "required-for-login",
	sessionTtlSeconds: 30 * DAY,
	sessionUpdateAgeSeconds: 1 * DAY,
	emailVerificationTtlSeconds: 30 * MINUTE,
	passwordResetTtlSeconds: 30 * MINUTE,
	resendCooldownSeconds: 60,
	maxFailedLoginAttempts: 5,
	failedLoginWindowSeconds: 60,
};

/** visao-game behaviour: verification unlocks features, not the app itself. */
export const OPTIONAL_VERIFICATION_POLICY: AuthPolicy = {
	...DEFAULT_AUTH_POLICY,
	emailVerification: "optional",
};
