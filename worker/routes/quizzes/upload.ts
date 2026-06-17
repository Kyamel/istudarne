import { AppError } from "../../../app/lib/server/errors";
import type { App } from "../../env";
import { container, currentUser } from "../../http/context";
import { uploadQuizRoute } from "../../openapi";

export function registerUploadQuiz(app: App) {
	app.openapi(uploadQuizRoute, async (c) => {
		const user = currentUser(c);
		if (!user) return c.text("Please sign in to upload a quiz.", 401);

		const form = await c.req.formData();
		const file = form.get("file");
		const visibility = form.get("visibility") === "public" ? "public" : "private";

		if (!(file instanceof File)) {
			return c.text("Send a JSON file in the file field.", 400);
		}
		if (file.size > 1024 * 1024 * 4) {
			return c.text("The JSON file must be at most 4 MB.", 413);
		}

		let parsed: unknown;
		try {
			parsed = JSON.parse(await file.text());
		} catch {
			return c.text("Invalid JSON.", 400);
		}

		try {
			const quiz = await container(c).services.quiz.importFromJson(parsed, visibility, user);
			return c.json({ quiz }, 201);
		} catch (error) {
			const message =
				error instanceof AppError || error instanceof Error ? error.message : "Import failed.";
			return c.text(message, 400);
		}
	});
}
