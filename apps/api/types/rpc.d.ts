/// <reference types="@cloudflare/workers-types" />
// Public RPC type entry for consumers (the web app's `hc<ApiRoutes>` client).
//
// The generated route declaration transitively references the Worker runtime
// types and the ambient `Env`. We pull the runtime types from the package (not
// the Worker's generated `worker-configuration.d.ts`, which types a binding as
// the Durable Object class and would drag the API's source into the consumer),
// and stub `Env` as empty — the RPC client never reads Bindings.
declare global {
	interface Env {}
}
export type { ApiRoutes } from "../dist/types/src/routes/index";
