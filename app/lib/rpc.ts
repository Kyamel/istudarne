/* Type-only import: erased at compile time (enforced by verbatimModuleSyntax),
   so no worker code ends up in the client bundle. Native (Capacitor) builds
   ship this same bundle and reach the API via VITE_API_BASE. */
import type { ApiRoutes } from "@api/routes";
import { hc } from "hono/client";

/* Base URL of the Worker API. Empty in the web app (same origin); set
   VITE_API_BASE for builds served from another origin, e.g. the Capacitor
   Android app (capacitor://localhost) talking to the deployed Worker. */
export const API_BASE: string = import.meta.env.VITE_API_BASE ?? "";

/* Access tokens are short-lived JWTs (~15 min). When a call comes back 401,
   we rotate the session once via the refresh cookie and retry; concurrent 401s
   share the same in-flight refresh. Uses the bare fetch so it can never
   recurse through the client below. */
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

const fetchWithRefresh: typeof fetch = async (input, init) => {
	let response = await fetch(input, init);

	const url =
		typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
	if (response.status === 401 && !url.includes("/api/auth/refresh")) {
		if (await tryRefresh()) {
			response = await fetch(input, init);
		}
	}

	return response;
};

/**
 * Type-safe RPC client (Hono `hc`) inferred from the Worker's route chain.
 * Paths, params, request bodies, and response payloads are all typed:
 *
 *   const res = await rpc.api.quizzes.search.$get({ query: { q: "HCI" } });
 *   if (res.ok) {
 *     const { quizzes } = await res.json(); // typed as QuizSummary[]
 *   }
 *
 * Web auth is cookie-based (`credentials: "include"`) with transparent
 * refresh on 401; a native client can instead pass an
 * `Authorization: Bearer <accessToken>` header via the `headers` option.
 */
export const rpc = hc<ApiRoutes>(API_BASE || "/", {
	fetch: fetchWithRefresh,
	init: { credentials: "include" },
});

export type Rpc = typeof rpc;
