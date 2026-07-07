import { SESSION_TTL_SECONDS } from "@server/services/authService";
import type { Context } from "hono";
import { getCookie, setCookie } from "hono/cookie";

const SESSION_COOKIE = "istudarne_session";

function isSecure(c: Context) {
	return new URL(c.req.url).protocol === "https:";
}

export function getSessionToken(c: Context) {
	return getCookie(c, SESSION_COOKIE) ?? null;
}

export function setSessionCookie(c: Context, token: string) {
	setCookie(c, SESSION_COOKIE, token, {
		httpOnly: true,
		secure: isSecure(c),
		sameSite: "Lax",
		path: "/",
		maxAge: SESSION_TTL_SECONDS,
	});
}

export function clearSessionCookie(c: Context) {
	setCookie(c, SESSION_COOKIE, "", {
		httpOnly: true,
		secure: isSecure(c),
		sameSite: "Lax",
		path: "/",
		maxAge: 0,
	});
}
