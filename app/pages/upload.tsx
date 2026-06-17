import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import {
	Button,
	ButtonLink,
	CenterActions,
	Eyebrow,
	Muted,
	Page,
	PageHeader,
	StatusMessage,
	TagRow,
} from "../components";
import { uploadQuiz } from "../lib/api";
import { m } from "../lib/i18n";
import styles from "./Upload.module.css";

type Preview = {
	title: string;
	description?: string;
	questionCount: number;
	tags: string[];
};

function buildPreview(value: unknown): Preview {
	if (!value || typeof value !== "object") {
		throw new Error("JSON inválido.");
	}
	const quiz = value as Record<string, unknown>;
	if (typeof quiz.title !== "string" || !quiz.title.trim()) {
		throw new Error("title");
	}
	if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) {
		throw new Error("questions");
	}
	return {
		title: quiz.title,
		description: typeof quiz.description === "string" ? quiz.description : undefined,
		questionCount: quiz.questions.length,
		tags: Array.isArray(quiz.tags)
			? quiz.tags.filter((tag): tag is string => typeof tag === "string")
			: [],
	};
}

export function UploadPage() {
	const [file, setFile] = useState<File | null>(null);
	const [preview, setPreview] = useState<Preview | null>(null);
	const [visibility, setVisibility] = useState<"private" | "public">("private");
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");
	const [quizId, setQuizId] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	async function handleFile(event: ChangeEvent<HTMLInputElement>) {
		setError("");
		setMessage("");
		setQuizId(null);
		setPreview(null);
		const selected = event.target.files?.[0] ?? null;
		setFile(selected);
		if (!selected) return;

		try {
			setPreview(buildPreview(JSON.parse(await selected.text())));
		} catch (err) {
			setError(err instanceof Error ? err.message : "JSON");
		}
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!file || !preview) return;
		setBusy(true);
		setMessage(m.upload_busy());
		setError("");
		try {
			const result = await uploadQuiz(file, visibility);
			setQuizId(result.quiz.id);
			setMessage(result.quiz.title);
		} catch (err) {
			setMessage("");
			setError(err instanceof Error ? err.message : m.auth_generic_error());
		} finally {
			setBusy(false);
		}
	}

	return (
		<Page>
			<PageHeader
				eyebrow={m.upload_eyebrow()}
				title={m.upload_title()}
				description={m.upload_subtitle()}
			/>

			<form className={styles.form} onSubmit={handleSubmit}>
				<label className={styles.fileField}>
					<span>{m.upload_file_label()}</span>
					<input accept="application/json,.json" onChange={handleFile} type="file" />
				</label>

				{preview ? (
					<div className={styles.preview} aria-live="polite">
						<Eyebrow>{m.upload_preview()}</Eyebrow>
						<h2>{preview.title}</h2>
						{preview.description ? <p>{preview.description}</p> : null}
						<Muted>{m.upload_questions_detected({ count: preview.questionCount })}</Muted>
						{preview.tags.length ? <TagRow tags={preview.tags} /> : null}
					</div>
				) : null}

				<fieldset className={styles.fieldset}>
					<legend className={styles.legend}>{m.upload_visibility_legend()}</legend>
					<label className={styles.choice}>
						<input
							checked={visibility === "private"}
							name="visibility"
							type="radio"
							onChange={() => setVisibility("private")}
						/>
						{m.upload_visibility_private()}
					</label>
					<label className={styles.choice}>
						<input
							checked={visibility === "public"}
							name="visibility"
							type="radio"
							onChange={() => setVisibility("public")}
						/>
						{m.upload_visibility_public()}
					</label>
				</fieldset>

				<Button variant="primary" disabled={busy || !preview} type="submit">
					{busy ? m.upload_busy() : m.upload_submit()}
				</Button>
			</form>

			{error ? (
				<StatusMessage tone="danger" role="alert">
					{error}
				</StatusMessage>
			) : null}
			{message ? <StatusMessage>{message}</StatusMessage> : null}
			{quizId ? (
				<CenterActions>
					<ButtonLink to={`/quizzes/${quizId}/play`} variant="primary">
						{m.upload_open_quiz()}
					</ButtonLink>
					<ButtonLink to="/quizzes">{m.upload_view_mine()}</ButtonLink>
				</CenterActions>
			) : null}
		</Page>
	);
}
