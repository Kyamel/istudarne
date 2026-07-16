/**
 * Thin, typed wrapper around the RPC client (`rpc.ts`). Every request body,
 * path param, and response type below is inferred from the Worker's route
 * chain (`ApiRoutes`) — changing an endpoint breaks the compile here, not in
 * production. No runtime schema parsing is needed: server and client share
 * the same contract source.
 */
import type {
	ChatMessage,
	CreateAiJobRequest,
	CreateGroupRequest,
	GroupDetail,
	GroupSummary,
	HistoryEntry,
	PatchQuizRequest,
	Profile,
	QuizDetail,
	QuizQuestion,
	QuizSummary,
	SubmitAnswerRequest,
	UserStats,
} from "@istudarne/contracts";
import type { CurrentUser } from "../auth/client";
import { API_BASE, rpc } from "./rpc";

export type {
	ChatMessage,
	CurrentUser,
	GroupDetail,
	GroupSummary,
	HistoryEntry,
	Profile,
	QuizDetail,
	QuizQuestion,
	QuizSummary,
	UserStats,
};

export class ApiError extends Error {
	constructor(
		message: string,
		readonly status: number,
	) {
		super(message);
		this.name = "ApiError";
	}
}

/** JSON body of the success (2xx) variants of an RPC response union. */
type SuccessJson<R> = R extends { ok: true; json(): Promise<infer T> } ? T : never;

/* All error responses share the `{ error }` shape (AppError / defaultHook /
   HTTPException mapping in the Worker), so one helper covers every call. */
async function unwrap<
	R extends { ok: boolean; status: number; json(): Promise<unknown>; text(): Promise<string> },
>(response: R): Promise<SuccessJson<R>> {
	if (!response.ok) {
		let message = `Request failed: ${response.status}`;
		const text = await response.text();
		if (text) {
			try {
				message = (JSON.parse(text) as { error?: string }).error ?? text;
			} catch {
				message = text;
			}
		}
		throw new ApiError(message, response.status);
	}
	try {
		return (await response.json()) as SuccessJson<R>;
	} catch {
		// 2xx with a body that is not valid JSON (truncated response, proxy page).
		throw new ApiError("Invalid API response.", response.status);
	}
}

/* Auth endpoints live in the self-contained client module (src/auth/client.ts),
   consumed through the AuthProvider in src/auth/context.tsx. */

/* --------------------------------- quizzes -------------------------------- */

export async function searchQuizzes(query = "") {
	const q = query.trim();
	return unwrap(await rpc.api.quizzes.search.$get({ query: q ? { q } : {} }));
}

export async function fetchMyQuizzes() {
	return unwrap(await rpc.api.me.quizzes.$get());
}

export async function fetchQuiz(id: string) {
	return unwrap(await rpc.api.quizzes[":id"].$get({ param: { id } }));
}

export async function patchQuiz(id: string, patch: PatchQuizRequest) {
	return unwrap(await rpc.api.quizzes[":id"].$patch({ param: { id }, json: patch }));
}

export async function deleteQuiz(id: string) {
	return unwrap(await rpc.api.quizzes[":id"].$delete({ param: { id } }));
}

export async function setQuizPublished(id: string, published: boolean) {
	const endpoint = published ? rpc.api.quizzes[":id"].publish : rpc.api.quizzes[":id"].unpublish;
	return unwrap(await endpoint.$post({ param: { id } }));
}

export async function uploadQuiz(file: File, visibility: "private" | "public") {
	return unwrap(await rpc.api.quizzes.upload.$post({ form: { file, visibility } }));
}

/* -------------------------------- attempts -------------------------------- */

export async function startAttempt(
	quizId: string,
	mode: "practice" | "exam" | "review" = "practice",
) {
	return unwrap(
		await rpc.api.quizzes[":id"].attempts.$post({ param: { id: quizId }, json: { mode } }),
	);
}

export async function submitAnswer(attemptId: string, input: SubmitAnswerRequest) {
	return unwrap(
		await rpc.api.attempts[":id"].answers.$post({ param: { id: attemptId }, json: input }),
	);
}

export async function finishAttempt(attemptId: string) {
	return unwrap(await rpc.api.attempts[":id"].finish.$post({ param: { id: attemptId } }));
}

/* ---------------------------------- me ------------------------------------ */

export async function fetchStats() {
	return unwrap(await rpc.api.me.stats.$get());
}

export async function fetchHistory() {
	return unwrap(await rpc.api.me.history.$get());
}

/* --------------------------------- social --------------------------------- */

export async function fetchProfile(username: string) {
	return unwrap(await rpc.api.users[":username"].$get({ param: { username } }));
}

export async function setFollow(username: string, follow: boolean) {
	const endpoint = rpc.api.users[":username"].follow;
	const response = follow
		? await endpoint.$post({ param: { username } })
		: await endpoint.$delete({ param: { username } });
	return unwrap(response);
}

/* --------------------------------- groups --------------------------------- */

export async function fetchGroups() {
	return unwrap(await rpc.api.groups.$get());
}

export async function createGroup(input: CreateGroupRequest) {
	return unwrap(await rpc.api.groups.$post({ json: input }));
}

export async function fetchGroup(id: string) {
	return unwrap(await rpc.api.groups[":id"].$get({ param: { id } }));
}

export async function joinGroup(id: string) {
	return unwrap(await rpc.api.groups[":id"].join.$post({ param: { id } }));
}

export async function leaveGroup(id: string) {
	return unwrap(await rpc.api.groups[":id"].leave.$post({ param: { id } }));
}

export async function shareQuiz(groupId: string, quizId: string) {
	return unwrap(
		await rpc.api.groups[":id"].quizzes.$post({ param: { id: groupId }, json: { quizId } }),
	);
}

export async function fetchGroupMessages(id: string) {
	return unwrap(await rpc.api.groups[":id"].messages.$get({ param: { id } }));
}

export function groupChatUrl(id: string) {
	// Derive the WebSocket endpoint from the API base (or the current origin).
	const base = API_BASE ? new URL(API_BASE) : new URL(window.location.href);
	const protocol = base.protocol === "https:" ? "wss:" : "ws:";
	return `${protocol}//${base.host}/api/groups/${id}/chat`;
}

/* ----------------------------------- ai ------------------------------------ */

export async function createAiJob(input: CreateAiJobRequest) {
	return unwrap(await rpc.api.ai.jobs.$post({ json: input }));
}

export async function fetchAiJob(jobId: string) {
	return unwrap(await rpc.api.ai.jobs[":jobId"].$get({ param: { jobId } }));
}
