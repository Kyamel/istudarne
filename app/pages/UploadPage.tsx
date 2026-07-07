import { uploadedQuizSchema } from "@shared/contracts";
import type { ChangeEvent, SubmitEvent } from "react";
import { useState } from "react";
import {
	Button,
	ButtonLink,
	CenterActions,
	ChoiceFieldset,
	Eyebrow,
	FileField,
	FormCard,
	Muted,
	Page,
	PageHeader,
	Panel,
	RadioChoice,
	StatusMessage,
	TagRow,
} from "../components";
import { uploadQuiz } from "../lib/api";
import { m } from "../lib/i18n";

type Preview = {
	title: string;
	description?: string;
	questionCount: number;
	tags: string[];
};

function buildPreview(value: unknown): Preview {
	const quiz = uploadedQuizSchema.parse(value);
	return {
		title: quiz.title,
		description: quiz.description,
		questionCount: quiz.questions.length,
		tags: quiz.tags ?? [],
	};
}

export default function UploadPage() {
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

	async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
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

			<FormCard onSubmit={handleSubmit}>
				<FileField
					label={m.upload_file_label()}
					accept="application/json,.json"
					onChange={handleFile}
				/>

				{preview ? (
					<Panel accent="secondary" aria-live="polite">
						<Eyebrow>{m.upload_preview()}</Eyebrow>
						<h2 className="text-xl">{preview.title}</h2>
						{preview.description ? <p>{preview.description}</p> : null}
						<Muted>{m.upload_questions_detected({ count: preview.questionCount })}</Muted>
						{preview.tags.length ? <TagRow tags={preview.tags} /> : null}
					</Panel>
				) : null}

				<ChoiceFieldset legend={m.upload_visibility_legend()}>
					<RadioChoice
						checked={visibility === "private"}
						label={m.upload_visibility_private()}
						name="visibility"
						onChange={() => setVisibility("private")}
					/>
					<RadioChoice
						checked={visibility === "public"}
						label={m.upload_visibility_public()}
						name="visibility"
						onChange={() => setVisibility("public")}
					/>
				</ChoiceFieldset>

				<Button variant="primary" disabled={busy || !preview} type="submit">
					{busy ? m.upload_busy() : m.upload_submit()}
				</Button>
			</FormCard>

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
