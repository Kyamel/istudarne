/* Type-only import: erased at compile time (enforced by verbatimModuleSyntax),
   so no worker code ends up in the client bundle. Native (Capacitor) builds
   ship this same bundle and reach the API via VITE_API_BASE. */
import type { ApiRoutes } from "@istudarne/api/routes";
import { hc } from "hono/client";
/* Auth transport comes from the Better Auth client wrapper so every endpoint
   gets cookies on web and Bearer on Capacitor/native builds. */
import { fetchWithAuth } from "../auth/client";
import { API_BASE } from "./api-base";

export { API_BASE } from "./api-base";

/**
 * Type-safe RPC client (Hono `hc`) inferred from the Worker's route chain.
 * Paths, params, request bodies, and response payloads are all typed:
 *
 *   const res = await rpc.api.quizzes.search.$get({ query: { q: "HCI" } });
 *   if (res.ok) {
 *     const { quizzes } = await res.json(); // typed as QuizSummary[]
 *   }
 *
 * Web auth is cookie-based (`credentials: "include"`); Capacitor/native builds
 * also attach the Better Auth bearer token captured from `set-auth-token`.
 */
export const rpc = hc<ApiRoutes>(API_BASE || "/", {
	fetch: fetchWithAuth,
	init: { credentials: "include" },
});

export type Rpc = typeof rpc;
