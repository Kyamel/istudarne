import { createAuthMiddleware } from "@api/auth/middleware";
import type { HonoEnv } from "@api/env";

/* Thin wiring over the self-contained auth module (worker/auth/): resolves
   Bearer/cookie into c.var.user using the per-request service container. */
export const authMiddleware = createAuthMiddleware<HonoEnv>(
	(c) => c.get("container").services.auth,
);
