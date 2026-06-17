import type { Context } from "hono";
import type { z } from "zod";
import { badRequest } from "../../app/lib/server/errors";

/** Lê e valida o corpo JSON, lançando AppError(400) com mensagem amigável. */
export async function readBody<T>(c: Context, schema: z.ZodType<T>): Promise<T> {
	let raw: unknown;
	try {
		raw = await c.req.json();
	} catch {
		throw badRequest("JSON inválido.");
	}
	const parsed = schema.safeParse(raw);
	if (!parsed.success) {
		throw badRequest(parsed.error.issues[0]?.message ?? "Dados inválidos.");
	}
	return parsed.data;
}
