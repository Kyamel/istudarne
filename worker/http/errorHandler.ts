import { AppError } from "@api/server/errors";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";

/** Converts domain errors (AppError) into consistent JSON responses. */
export function handleError(error: Error, c: Context) {
	if (error instanceof AppError) {
		return c.json({ error: error.message }, error.status as ContentfulStatusCode);
	}
	// Thrown by Hono middleware (csrf, body-limit, ...); keep the JSON shape.
	if (error instanceof HTTPException) {
		return c.json(
			{ error: error.message || "Request blocked." },
			error.status as ContentfulStatusCode,
		);
	}
	console.error("Unhandled error:", error);
	return c.json({ error: "Internal server error." }, 500);
}
