import { AppError } from "../../../app/lib/server/errors";
import type { App } from "../../env";
import { container, currentUser } from "../../http/context";
import { uploadQuizRoute } from "../../openapi";

export function registerUploadQuiz(app: App) {
	app.openapi(uploadQuizRoute, async (c) => {
		const user = currentUser(c);
		if (!user) return c.text("Faça login para enviar um quiz.", 401);

		const form = await c.req.formData();
		const file = form.get("file");
		const visibility = form.get("visibility") === "public" ? "public" : "private";

		if (!(file instanceof File)) {
			return c.text("Envie um arquivo JSON no campo file.", 400);
		}
		if (file.size > 1024 * 1024 * 4) {
			return c.text("O arquivo JSON deve ter no máximo 4 MB.", 413);
		}

		let parsed: unknown;
		try {
			parsed = JSON.parse(await file.text());
		} catch {
			return c.text("JSON inválido.", 400);
		}

		try {
			const quiz = await container(c).services.quiz.importFromJson(parsed, visibility, user);
			return c.json({ quiz }, 201);
		} catch (error) {
			const message =
				error instanceof AppError || error instanceof Error ? error.message : "Falha ao importar.";
			return c.text(message, 400);
		}
	});
}
