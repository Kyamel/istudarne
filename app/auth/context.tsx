/**
 * Auth module (client) — React context. Wraps the fetch client in
 * `./client.ts` with session state: boots by probing /api/auth/me (with one
 * silent refresh attempt), and exposes login/register/logout plus the
 * verification helpers. Registration does NOT sign the user in — the account
 * must verify its email first.
 */
import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as authClient from "./client";
import { AuthError, type CurrentUser } from "./client";

export type { CurrentUser };
export { AuthError };

type AuthState = {
	user: CurrentUser | null;
	loading: boolean;
	login: (email: string, password: string) => Promise<void>;
	register: (input: {
		email: string;
		username: string;
		displayName: string;
		password: string;
	}) => Promise<void>;
	logout: () => Promise<void>;
	resendVerification: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<CurrentUser | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let active = true;
		(async () => {
			try {
				return await authClient.fetchMe();
			} catch (error) {
				// Expired access cookie: rotate the session once and retry.
				if (error instanceof AuthError && error.status === 401 && (await authClient.tryRefresh())) {
					return authClient.fetchMe();
				}
				throw error;
			}
		})()
			.then((data) => active && setUser(data.user))
			.catch(() => active && setUser(null))
			.finally(() => active && setLoading(false));
		return () => {
			active = false;
		};
	}, []);

	const login = useCallback(async (email: string, password: string) => {
		const data = await authClient.login({ email, password });
		setUser(data.user);
	}, []);

	/* Registration no longer signs the user in: the account must verify its
	   email first, so the user stays on the login screen. */
	const register = useCallback(
		async (input: { email: string; username: string; displayName: string; password: string }) => {
			await authClient.register(input);
		},
		[],
	);

	const logout = useCallback(async () => {
		await authClient.logout();
		setUser(null);
	}, []);

	const resendVerification = useCallback(async (email: string) => {
		await authClient.resendVerification(email);
	}, []);

	const value = useMemo<AuthState>(
		() => ({ user, loading, login, register, logout, resendVerification }),
		[user, loading, login, register, logout, resendVerification],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) throw new Error("useAuth must be used within AuthProvider.");
	return context;
}
