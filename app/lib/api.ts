import {
	authUserResponseSchema,
	type ChatMessage,
	type CreateGroupRequest,
	type CurrentUser,
	createGroupRequestSchema,
	createGroupResponseSchema,
	finishAttemptResponseSchema,
	type GroupDetail,
	type GroupSummary,
	groupDetailResponseSchema,
	groupListResponseSchema,
	groupMessagesResponseSchema,
	type HistoryEntry,
	historyResponseSchema,
	type LoginRequest,
	loginRequestSchema,
	okResponseSchema,
	type PatchQuizRequest,
	type Profile,
	patchQuizRequestSchema,
	profileResponseSchema,
	type QuizDetail,
	type QuizQuestion,
	type QuizSummary,
	quizDetailResponseSchema,
	quizListResponseSchema,
	quizSummaryResponseSchema,
	type RegisterRequest,
	registerRequestSchema,
	type SubmitAnswerRequest,
	shareQuizRequestSchema,
	startAttemptRequestSchema,
	startAttemptResponseSchema,
	statsResponseSchema,
	submitAnswerRequestSchema,
	submitAnswerResponseSchema,
	type UserStats,
} from "@shared/contracts";
import type { z } from "zod";

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

/* Base URL of the Worker API. Empty in the web app (same origin); set
   VITE_API_BASE for builds served from another origin, e.g. the Capacitor
   Android app (capacitor://localhost) talking to the deployed Worker. */
const API_BASE: string = import.meta.env.VITE_API_BASE ?? "";

/* Access tokens are short-lived JWTs (~15 min). When a call comes back 401,
   we rotate the session once via the refresh cookie and retry; concurrent 401s
   share the same in-flight refresh. */
let refreshPromise: Promise<boolean> | null = null;

function tryRefresh(): Promise<boolean> {
	refreshPromise ??= fetch(`${API_BASE}/api/auth/refresh`, {
		method: "POST",
		credentials: "include",
		headers: { "Content-Type": "application/json" },
		body: "{}",
	})
		.then((response) => response.ok)
		.catch(() => false)
		.finally(() => {
			refreshPromise = null;
		});
	return refreshPromise;
}

async function request<T>(path: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T> {
	let response = await fetch(`${API_BASE}${path}`, {
		credentials: "include",
		...init,
	});

	if (response.status === 401 && !path.startsWith("/api/auth/")) {
		if (await tryRefresh()) {
			response = await fetch(`${API_BASE}${path}`, {
				credentials: "include",
				...init,
			});
		}
	}

	if (!response.ok) {
		let message = `Request failed: ${response.status}`;
		const text = await response.text();
		if (text) {
			try {
				const data = JSON.parse(text) as { error?: string };
				message = data.error ?? text;
			} catch {
				message = text;
			}
		}
		throw new ApiError(message, response.status);
	}

	const data = await response.json();
	const parsed = schema.safeParse(data);
	if (!parsed.success) {
		throw new ApiError("Invalid API response.", response.status);
	}
	return parsed.data;
}

function jsonInit(method: string, body: unknown): RequestInit {
	return {
		method,
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	};
}

/* ---------------------------------- auth ---------------------------------- */

export function register(input: RegisterRequest) {
	const body = registerRequestSchema.parse(input);
	return request("/api/auth/register", authUserResponseSchema, jsonInit("POST", body));
}

export function login(input: LoginRequest) {
	const body = loginRequestSchema.parse(input);
	return request("/api/auth/login", authUserResponseSchema, jsonInit("POST", body));
}

export function logout() {
	return request("/api/auth/logout", okResponseSchema, jsonInit("POST", {}));
}

/** Boot-time session probe: refreshes once if the access token has expired. */
export async function fetchMe() {
	try {
		return await request("/api/auth/me", authUserResponseSchema);
	} catch (error) {
		if (error instanceof ApiError && error.status === 401 && (await tryRefresh())) {
			return request("/api/auth/me", authUserResponseSchema);
		}
		throw error;
	}
}

/* --------------------------------- quizzes -------------------------------- */

export function searchQuizzes(query = "") {
	const params = new URLSearchParams();
	if (query.trim()) params.set("q", query.trim());
	return request(`/api/quizzes/search?${params.toString()}`, quizListResponseSchema);
}

export function fetchMyQuizzes() {
	return request("/api/me/quizzes", quizListResponseSchema);
}

export function fetchQuiz(id: string) {
	return request(`/api/quizzes/${id}`, quizDetailResponseSchema);
}

export function patchQuiz(id: string, patch: PatchQuizRequest) {
	const body = patchQuizRequestSchema.parse(patch);
	return request(`/api/quizzes/${id}`, quizSummaryResponseSchema, jsonInit("PATCH", body));
}

export function deleteQuiz(id: string) {
	return request(`/api/quizzes/${id}`, okResponseSchema, { method: "DELETE" });
}

export function setQuizPublished(id: string, published: boolean) {
	return request(
		`/api/quizzes/${id}/${published ? "publish" : "unpublish"}`,
		quizSummaryResponseSchema,
		{ method: "POST" },
	);
}

export function uploadQuiz(file: File, visibility: "private" | "public") {
	const formData = new FormData();
	formData.set("file", file);
	formData.set("visibility", visibility);
	return request("/api/quizzes/upload", quizSummaryResponseSchema, {
		method: "POST",
		body: formData,
	});
}

/* -------------------------------- attempts -------------------------------- */

export function startAttempt(quizId: string, mode = "practice") {
	const body = startAttemptRequestSchema.parse({ mode });
	return request(
		`/api/quizzes/${quizId}/attempts`,
		startAttemptResponseSchema,
		jsonInit("POST", body),
	);
}

export function submitAnswer(attemptId: string, input: SubmitAnswerRequest) {
	const body = submitAnswerRequestSchema.parse(input);
	return request(
		`/api/attempts/${attemptId}/answers`,
		submitAnswerResponseSchema,
		jsonInit("POST", body),
	);
}

export function finishAttempt(attemptId: string) {
	return request(`/api/attempts/${attemptId}/finish`, finishAttemptResponseSchema, {
		method: "POST",
	});
}

/* ---------------------------------- me ------------------------------------ */

export function fetchStats() {
	return request("/api/me/stats", statsResponseSchema);
}

export function fetchHistory() {
	return request("/api/me/history", historyResponseSchema);
}

/* --------------------------------- social --------------------------------- */

export function fetchProfile(username: string) {
	return request(`/api/users/${username}`, profileResponseSchema);
}

export function setFollow(username: string, follow: boolean) {
	return request(`/api/users/${username}/follow`, okResponseSchema, {
		method: follow ? "POST" : "DELETE",
	});
}

/* --------------------------------- groups --------------------------------- */

export function fetchGroups() {
	return request("/api/groups", groupListResponseSchema);
}

export function createGroup(input: CreateGroupRequest) {
	const body = createGroupRequestSchema.parse(input);
	return request("/api/groups", createGroupResponseSchema, jsonInit("POST", body));
}

export function fetchGroup(id: string) {
	return request(`/api/groups/${id}`, groupDetailResponseSchema);
}

export function joinGroup(id: string) {
	return request(`/api/groups/${id}/join`, okResponseSchema, { method: "POST" });
}

export function leaveGroup(id: string) {
	return request(`/api/groups/${id}/leave`, okResponseSchema, { method: "POST" });
}

export function shareQuiz(groupId: string, quizId: string) {
	const body = shareQuizRequestSchema.parse({ quizId });
	return request(`/api/groups/${groupId}/quizzes`, okResponseSchema, jsonInit("POST", body));
}

export function fetchGroupMessages(id: string) {
	return request(`/api/groups/${id}/messages`, groupMessagesResponseSchema);
}

export function groupChatUrl(id: string) {
	// Derive the WebSocket endpoint from the API base (or the current origin).
	const base = API_BASE ? new URL(API_BASE) : new URL(window.location.href);
	const protocol = base.protocol === "https:" ? "wss:" : "ws:";
	return `${protocol}//${base.host}/api/groups/${id}/chat`;
}
