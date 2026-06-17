import type { Context } from "hono";
import type { z } from "zod";
import { badRequest } from "../../app/lib/server/errors";

/** Reads and validates the JSON body, throwing AppError(400) with a readable message. */
export async function readBody<T>(c: Context, schema: z.ZodType<T>): Promise<T> {
	let raw: unknown;
	try {
		raw = await c.req.json();
	} catch {
		throw badRequest("Invalid JSON.");
	}
	const parsed = schema.safeParse(raw);
	if (!parsed.success) {
		throw badRequest(parsed.error.issues[0]?.message ?? "Invalid data.");
	}
	return parsed.data;
}
