import type { AuthTokens } from "@api/server/services/authService";
import { ACCESS_TOKEN_TTL_SECONDS, REFRESH_TOKEN_TTL_SECONDS } from "@api/server/services/authService";
import type { Context } from "hono";
import { getCookie, setCookie } from "hono/cookie";

const ACCESS_COOKIE = "istudarne_access";
const REFRESH_COOKIE = "istudarne_refresh";

/* The refresh cookie is only ever needed by the auth endpoints, so its path is
   restricted to keep it off every other request. */
const REFRESH_COOKIE_PATH = "/api/auth";

export const ACCESS_COOKIE_NAME = ACCESS_COOKIE;

function isSecure(c: Context) {
	return new URL(c.req.url).protocol === "https:";
}

export function getAccessTokenCookie(c: Context) {
	return getCookie(c, ACCESS_COOKIE) ?? null;
}

export function getRefreshTokenCookie(c: Context) {
	return getCookie(c, REFRESH_COOKIE) ?? null;
}

/** Web clients authenticate via httpOnly cookies; native apps use the JSON tokens. */
export function setAuthCookies(c: Context, tokens: AuthTokens) {
	setCookie(c, ACCESS_COOKIE, tokens.accessToken, {
		httpOnly: true,
		secure: isSecure(c),
		sameSite: "Lax",
		path: "/",
		maxAge: ACCESS_TOKEN_TTL_SECONDS,
	});
	setCookie(c, REFRESH_COOKIE, tokens.refreshToken, {
		httpOnly: true,
		secure: isSecure(c),
		sameSite: "Lax",
		path: REFRESH_COOKIE_PATH,
		maxAge: REFRESH_TOKEN_TTL_SECONDS,
	});
}

export function clearAuthCookies(c: Context) {
	setCookie(c, ACCESS_COOKIE, "", {
		httpOnly: true,
		secure: isSecure(c),
		sameSite: "Lax",
		path: "/",
		maxAge: 0,
	});
	setCookie(c, REFRESH_COOKIE, "", {
		httpOnly: true,
		secure: isSecure(c),
		sameSite: "Lax",
		path: REFRESH_COOKIE_PATH,
		maxAge: 0,
	});
}
