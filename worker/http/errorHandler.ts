import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { AppError } from "../../app/lib/server/errors";

/** Converte erros de domínio (AppError) em respostas JSON consistentes. */
export function handleError(error: Error, c: Context) {
	if (error instanceof AppError) {
		return c.json({ error: error.message }, error.status as ContentfulStatusCode);
	}
	console.error("Erro não tratado:", error);
	return c.json({ error: "Erro interno do servidor." }, 500);
}
