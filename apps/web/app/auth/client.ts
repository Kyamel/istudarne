import { createAuthClient } from "better-auth/react";
import { API_BASE } from "../lib/api-base";

export type AuthUser = {
	id: string;
	email: string;
	emailVerified: boolean;
	name: string;
	image?: string | null;
};

export type CurrentUser = {
	id: string;
	username: string;
	displayName: string;
	bio: string | null;
	avatarUrl: string | null;
};

export type LoginRequest = {
	email: string;
	password: string;
};

export type RegisterRequest = {
	email: string;
	username: string;
	displayName: string;
	password: string;
};

type MeResponse = {
	authUser: AuthUser;
	domainUser: CurrentUser | null;
};

export class AuthError extends Error {
	constructor(
		message: string,
		readonly status: number,
	) {
		super(message);
		this.name = "AuthError";
	}
}

const AUTH_BASE_PATH = "/api/auth";
const AUTH_TOKEN_STORAGE_KEY = "istudarne.authToken";

function authOrigin() {
	return API_BASE || undefined;
}

function storedBearerToken() {
	if (typeof window === "undefined") return null;
	return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

function storeBearerToken(token: string | null) {
	if (typeof window === "undefined") return;
	if (token) {
		window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
	} else {
		window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
	}
}

function rememberAuthToken(response: Response) {
	const token = response.headers.get("set-auth-token");
	if (token) storeBearerToken(token);
}

function withBearer(init: RequestInit | undefined): RequestInit {
	const headers = new Headers(init?.headers);
	const token = storedBearerToken();
	if (token && !headers.has("Authorization")) {
		headers.set("Authorization", `Bearer ${token}`);
	}
	return { ...init, credentials: init?.credentials ?? "include", headers };
}

async function authFetch(input: RequestInfo | URL, init?: RequestInit) {
	const response = await fetch(input, withBearer(init));
	rememberAuthToken(response);
	return response;
}

export const authClient = createAuthClient({
	baseURL: authOrigin(),
	basePath: AUTH_BASE_PATH,
	fetchOptions: {
		customFetchImpl: authFetch,
	},
});

function authError(error: { message?: string; status?: number; statusText?: string } | null): AuthError {
	return new AuthError(
		error?.message || error?.statusText || "Authentication failed.",
		error?.status ?? 500,
	);
}

async function parse<T>(response: Response): Promise<T> {
	if (!response.ok) {
		let message = `Request failed: ${response.status}`;
		const text = await response.text();
		if (text) {
			try {
				const body = JSON.parse(text) as { error?: string; message?: string };
				message = body.error ?? body.message ?? text;
			} catch {
				message = text;
			}
		}
		throw new AuthError(message, response.status);
	}
	try {
		return (await response.json()) as T;
	} catch {
		throw new AuthError("Invalid API response.", response.status);
	}
}

async function postAuth<T>(path: string, body: unknown): Promise<T> {
	const response = await authFetch(`${API_BASE}${AUTH_BASE_PATH}${path}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
	return parse<T>(response);
}

export async function fetchMe() {
	const response = await fetchWithAuth(`${API_BASE}/api/me`);
	const data = await parse<MeResponse>(response);
	if (!data.domainUser) {
		throw new AuthError("Authenticated account is missing an app profile.", 401);
	}
	return { user: data.domainUser, authUser: data.authUser };
}

export async function register(input: RegisterRequest) {
	await postAuth("/sign-up/email", {
		email: input.email,
		password: input.password,
		name: input.displayName || input.username,
		username: input.username,
		displayName: input.displayName,
	});
	return { ok: true as const };
}

export async function login(input: LoginRequest) {
	const result = await authClient.signIn.email({
		email: input.email,
		password: input.password,
	});
	if (result.error) throw authError(result.error);
	return fetchMe();
}

export async function logout() {
	const result = await authClient.signOut();
	storeBearerToken(null);
	if (result.error) throw authError(result.error);
	return { ok: true as const };
}

export async function verifyEmail(token: string) {
	const result = await authClient.verifyEmail({ query: { token } });
	if (result.error) throw authError(result.error);
	return { ok: true as const };
}

export async function resendVerification(email: string) {
	const result = await authClient.sendVerificationEmail({ email });
	if (result.error) throw authError(result.error);
	return { ok: true as const };
}

export const fetchWithAuth: typeof fetch = async (input, init) => {
	return authFetch(input, init);
};
