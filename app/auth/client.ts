/**
 * Auth module (client) — plain-fetch client for the Hono auth module in
 * `worker/auth/`. Self-contained on purpose: no dependency on the app's RPC
 * client, so it can be copied into any SPA that talks to the same endpoints.
 *
 * Web transport: httpOnly cookies (`credentials: "include"`); the JSON tokens
 * in login responses can be ignored. A native shell would instead persist
 * `tokens` and send `Authorization: Bearer` headers.
 */

/* Type-only import (erased at build): the server module owns the contract. */
import type { AuthTokens, CurrentUser, LoginRequest, RegisterRequest } from "@api/auth/contracts";

export type { AuthTokens, CurrentUser, LoginRequest, RegisterRequest };

export class AuthError extends Error {
	constructor(
		message: string,
		readonly status: number,
	) {
		super(message);
		this.name = "AuthError";
	}
}

/* Base URL of the API. Empty when served from the same origin; set
   VITE_API_BASE for builds served from another origin (e.g. Capacitor). */
const API_BASE: string = import.meta.env.VITE_API_BASE ?? "";

async function post<T>(path: string, body: unknown): Promise<T> {
	const response = await fetch(`${API_BASE}${path}`, {
		method: "POST",
		credentials: "include",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
	return parse<T>(response);
}

async function parse<T>(response: Response): Promise<T> {
	if (!response.ok) {
		let message = `Request failed: ${response.status}`;
		const text = await response.text();
		if (text) {
			try {
				message = (JSON.parse(text) as { error?: string }).error ?? text;
			} catch {
				message = text;
			}
		}
		throw new AuthError(message, response.status);
	}
	try {
		return (await response.json()) as T;
	} catch {
		throw new AuthError("Invalid API response.", response.status);
	}
}

export function register(input: RegisterRequest) {
	return post<{ user: CurrentUser }>("/api/auth/register", input);
}

export function login(input: LoginRequest) {
	return post<{ user: CurrentUser; tokens: AuthTokens }>("/api/auth/login", input);
}

export function logout() {
	return post<{ ok: true }>("/api/auth/logout", {});
}

export async function fetchMe() {
	const response = await fetch(`${API_BASE}/api/auth/me`, { credentials: "include" });
	return parse<{ user: CurrentUser }>(response);
}

export function verifyEmail(token: string) {
	return post<{ ok: true }>("/api/auth/verify-email", { token });
}

export function resendVerification(email: string) {
	return post<{ ok: true }>("/api/auth/resend-verification", { email });
}

/* ------------------------- session auto-refresh ---------------------------- */

/* Access tokens are short-lived JWTs (~15 min). Concurrent 401s share the
   same in-flight refresh. Uses the bare fetch so it can never recurse. */
let refreshPromise: Promise<boolean> | null = null;

export function tryRefresh(): Promise<boolean> {
	refreshPromise ??= fetch(`${API_BASE}/api/auth/refresh`, {
		method: "POST",
		credentials: "include",
		headers: { "Content-Type": "application/json" },
		body: "{}",
	})
		.then((response) => response.ok)
		.catch(() => false)
		.finally(() => {
			refreshPromise = null;
		});
	return refreshPromise;
}

/* Endpoints where a 401 means "bad credentials", not "expired session" —
   refreshing and retrying would just waste a round trip. */
const NO_RETRY_PATHS = ["/api/auth/refresh", "/api/auth/login"];

/**
 * Drop-in `fetch` wrapper that transparently rotates the session once on 401
 * and retries. Give it to your API client (see `app/lib/rpc.ts`) so every
 * endpoint benefits, not only the auth ones.
 */
export const fetchWithRefresh: typeof fetch = async (input, init) => {
	let response = await fetch(input, init);

	const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
	if (response.status === 401 && !NO_RETRY_PATHS.some((path) => url.includes(path))) {
		if (await tryRefresh()) {
			response = await fetch(input, init);
		}
	}

	return response;
};
