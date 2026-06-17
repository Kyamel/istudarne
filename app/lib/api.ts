export type QuizSummary = {
	id: string;
	title: string;
	description: string | null;
	visibility: "private" | "public" | "unlisted";
	questionCount: number;
	playsCount: number;
	ownerUsername: string;
	ownerDisplayName: string;
	tags: string[];
};

export type QuizQuestion = {
	id: string;
	topic: string | null;
	statement: string;
	answer: string;
	explanation: string | null;
	options: { id: string; key: string; text: string }[];
};

export type QuizDetail = QuizSummary & {
	ownerId: string;
	questions: QuizQuestion[];
};

export type CurrentUser = {
	id: string;
	email: string;
	username: string;
	displayName: string;
	bio: string | null;
	avatarUrl: string | null;
};

export type UserStats = {
	questionsToday: number;
	questionsTotal: number;
	accuracy: number;
	streak: number;
	points: number;
	quizzesOwned: number;
	attempts: number;
};

export type HistoryEntry = {
	attemptId: string;
	quizId: string;
	quizTitle: string;
	mode: string;
	status: string;
	score: number;
	correctCount: number;
	wrongCount: number;
	startedAt: number;
	finishedAt: number | null;
};

export type Profile = {
	id: string;
	username: string;
	displayName: string;
	bio: string | null;
	avatarUrl: string | null;
	followers: number;
	following: number;
	stats: UserStats;
	quizzes: QuizSummary[];
	isFollowing: boolean;
};

export type GroupSummary = {
	id: string;
	name: string;
	description: string | null;
	visibility: "public" | "private" | "invite";
	memberCount: number;
	isMember: boolean;
	role: "owner" | "moderator" | "member" | null;
};

export type GroupDetail = {
	id: string;
	name: string;
	description: string | null;
	visibility: "public" | "private" | "invite";
	ownerId: string;
	role: "owner" | "moderator" | "member" | null;
	members: {
		userId: string;
		role: string;
		username: string;
		displayName: string;
	}[];
	quizzes: QuizSummary[];
};

export type ChatMessage = {
	id: string;
	body: string;
	senderId: string;
	displayName: string;
	createdAt: number;
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

async function request<T>(url: string, init?: RequestInit): Promise<T> {
	const response = await fetch(url, {
		credentials: "include",
		...init,
	});

	if (!response.ok) {
		let message = `Falha na requisição: ${response.status}`;
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

	if (response.status === 204) return undefined as T;
	return response.json() as Promise<T>;
}

function jsonInit(method: string, body: unknown): RequestInit {
	return {
		method,
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	};
}

/* ---------------------------------- auth ---------------------------------- */

export function register(input: {
	email: string;
	username: string;
	displayName: string;
	password: string;
}) {
	return request<{ user: CurrentUser }>("/api/auth/register", jsonInit("POST", input));
}

export function login(input: { email: string; password: string }) {
	return request<{ user: CurrentUser }>("/api/auth/login", jsonInit("POST", input));
}

export function logout() {
	return request<{ ok: true }>("/api/auth/logout", { method: "POST" });
}

export function fetchMe() {
	return request<{ user: CurrentUser }>("/api/auth/me");
}

/* --------------------------------- quizzes -------------------------------- */

export function searchQuizzes(query = "") {
	const params = new URLSearchParams();
	if (query.trim()) params.set("q", query.trim());
	return request<{ quizzes: QuizSummary[] }>(`/api/quizzes/search?${params.toString()}`);
}

export function fetchMyQuizzes() {
	return request<{ quizzes: QuizSummary[] }>("/api/me/quizzes");
}

export function fetchQuiz(id: string) {
	return request<{ quiz: QuizDetail }>(`/api/quizzes/${id}`);
}

export function patchQuiz(
	id: string,
	patch: {
		title?: string;
		description?: string | null;
		visibility?: "private" | "public" | "unlisted";
		tags?: string[];
	},
) {
	return request<{ quiz: QuizSummary }>(`/api/quizzes/${id}`, jsonInit("PATCH", patch));
}

export function deleteQuiz(id: string) {
	return request<{ ok: true }>(`/api/quizzes/${id}`, { method: "DELETE" });
}

export function setQuizPublished(id: string, published: boolean) {
	return request<{ quiz: QuizSummary }>(
		`/api/quizzes/${id}/${published ? "publish" : "unpublish"}`,
		{ method: "POST" },
	);
}

export function uploadQuiz(file: File, visibility: "private" | "public") {
	const formData = new FormData();
	formData.set("file", file);
	formData.set("visibility", visibility);
	return request<{ quiz: QuizSummary }>("/api/quizzes/upload", {
		method: "POST",
		body: formData,
	});
}

/* -------------------------------- attempts -------------------------------- */

export function startAttempt(quizId: string, mode = "practice") {
	return request<{ attemptId: string }>(
		`/api/quizzes/${quizId}/attempts`,
		jsonInit("POST", { mode }),
	);
}

export function submitAnswer(
	attemptId: string,
	input: { questionId: string; selectedOption: string; timeSpentMs?: number },
) {
	return request<{ isCorrect: boolean; answer: string }>(
		`/api/attempts/${attemptId}/answers`,
		jsonInit("POST", input),
	);
}

export function finishAttempt(attemptId: string) {
	return request<{
		summary: { total: number; correct: number; wrong: number; points: number };
	}>(`/api/attempts/${attemptId}/finish`, { method: "POST" });
}

/* ---------------------------------- me ------------------------------------ */

export function fetchStats() {
	return request<{ stats: UserStats }>("/api/me/stats");
}

export function fetchHistory() {
	return request<{ history: HistoryEntry[] }>("/api/me/history");
}

/* --------------------------------- social --------------------------------- */

export function fetchProfile(username: string) {
	return request<{ profile: Profile }>(`/api/users/${username}`);
}

export function setFollow(username: string, follow: boolean) {
	return request<{ ok: true }>(`/api/users/${username}/follow`, {
		method: follow ? "POST" : "DELETE",
	});
}

/* --------------------------------- groups --------------------------------- */

export function fetchGroups() {
	return request<{ groups: GroupSummary[] }>("/api/groups");
}

export function createGroup(input: {
	name: string;
	description?: string | null;
	visibility: "public" | "private" | "invite";
}) {
	return request<{ id: string }>("/api/groups", jsonInit("POST", input));
}

export function fetchGroup(id: string) {
	return request<{ group: GroupDetail }>(`/api/groups/${id}`);
}

export function joinGroup(id: string) {
	return request<{ ok: true }>(`/api/groups/${id}/join`, { method: "POST" });
}

export function leaveGroup(id: string) {
	return request<{ ok: true }>(`/api/groups/${id}/leave`, { method: "POST" });
}

export function shareQuiz(groupId: string, quizId: string) {
	return request<{ ok: true }>(`/api/groups/${groupId}/quizzes`, jsonInit("POST", { quizId }));
}

export function fetchGroupMessages(id: string) {
	return request<{ messages: ChatMessage[] }>(`/api/groups/${id}/messages`);
}

export function groupChatUrl(id: string) {
	const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
	return `${protocol}//${window.location.host}/api/groups/${id}/chat`;
}
