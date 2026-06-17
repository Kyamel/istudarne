import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { AppError } from "../../app/lib/server/errors";

/** Converts domain errors (AppError) into consistent JSON responses. */
export function handleError(error: Error, c: Context) {
	if (error instanceof AppError) {
		return c.json({ error: error.message }, error.status as ContentfulStatusCode);
	}
	console.error("Unhandled error:", error);
	return c.json({ error: "Internal server error." }, 500);
}
