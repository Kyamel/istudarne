/* Compatibility shim: the auth context now lives in the self-contained module
   at app/auth/. Import from there in new code. */

export type { CurrentUser } from "../auth/context";
export { AuthError, AuthProvider, useAuth } from "../auth/context";
