/* Type-only import: erased at compile time (enforced by verbatimModuleSyntax),
   so no worker code ends up in the client bundle. Native (Capacitor) builds
   ship this same bundle and reach the API via VITE_API_BASE. */
import type { ApiRoutes } from "@api/routes";
import { hc } from "hono/client";
/* Session auto-refresh (401 → rotate once → retry) comes from the
   self-contained auth module so every endpoint benefits from it. */
import { fetchWithRefresh } from "../auth/client";

/* Base URL of the Worker API. Empty in the web app (same origin); set
   VITE_API_BASE for builds served from another origin, e.g. the Capacitor
   Android app (capacitor://localhost) talking to the deployed Worker. */
export const API_BASE: string = import.meta.env.VITE_API_BASE ?? "";

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
