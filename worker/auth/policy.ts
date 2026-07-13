/**
 * Auth module — the knobs a host project is expected to disagree on.
 *
 * Ported from the visão-game fork of this module so both projects share one
 * source of truth. The defaults reproduce this module's historical behaviour
 * (email verification required before login, 15-min access tokens, 2-day
 * verification links), so an existing host that passes no policy is unchanged.
 */

export type EmailVerificationPolicy =
	/** Login is refused with 403 until the address is verified (istudarne default). */
	| "required-for-login"
	/** Login works immediately; verification only gates features (visão-game). */
	| "optional";

export type AuthPolicy = {
	emailVerification: EmailVerificationPolicy;

	/** Access tokens are stateless, so this is also the session-revocation lag. */
	accessTokenTtlSeconds: number;
	refreshTokenTtlSeconds: number;
	emailVerificationTtlSeconds: number;
	passwordResetTtlSeconds: number;

	/** Server-side floor between verification/reset emails for one address. */
	resendCooldownSeconds: number;

	/**
	 * How long a just-rotated refresh token keeps being accepted.
	 *
	 * Rotation is not atomic across parallel requests: a page load that fires
	 * several requests at once presents the same refresh token more than once.
	 * Without this window the second one looks like a stolen token and revokes
	 * every session the user has. Outside the window, reuse is still treated as
	 * theft and revokes everything.
	 */
	refreshReuseLeewaySeconds: number;
};

/** Reproduces the module's pre-policy behaviour; safe for existing hosts. */
export const DEFAULT_AUTH_POLICY: AuthPolicy = {
	emailVerification: "required-for-login",
	accessTokenTtlSeconds: 60 * 15,
	refreshTokenTtlSeconds: 60 * 60 * 24 * 30,
	emailVerificationTtlSeconds: 60 * 60 * 24 * 2,
	passwordResetTtlSeconds: 60 * 30,
	resendCooldownSeconds: 60,
	refreshReuseLeewaySeconds: 30,
};
