import type { HonoEnv } from "@api/env";
import { AppError } from "@api/server/errors";
import type { MiddlewareHandler } from "hono";

/**
 * Rate limiting backed by a Cloudflare Workers ratelimit binding, keyed by
 * client IP + path so each endpoint has its own bucket. Counters are per-colo
 * (approximate), which is the right trade-off for brute-force/abuse protection
 * on auth and paid AI endpoints.
 */
export const rateLimitBy =
	(pickLimiter: (env: CloudflareBindings) => RateLimit): MiddlewareHandler<HonoEnv> =>
	async (c, next) => {
		const ip = c.req.header("CF-Connecting-IP") ?? "unknown";
		const { success } = await pickLimiter(c.env).limit({
			key: `${ip}:${new URL(c.req.url).pathname}`,
		});
		if (!success) {
			throw new AppError(429, "Too many requests. Please try again in a minute.");
		}
		await next();
	};
