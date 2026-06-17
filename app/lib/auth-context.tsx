import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { CurrentUser } from "./api";
import * as api from "./api";

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
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<CurrentUser | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let active = true;
		api
			.fetchMe()
			.then((data) => active && setUser(data.user))
			.catch(() => active && setUser(null))
			.finally(() => active && setLoading(false));
		return () => {
			active = false;
		};
	}, []);

	const login = useCallback(async (email: string, password: string) => {
		const data = await api.login({ email, password });
		setUser(data.user);
	}, []);

	const register = useCallback(
		async (input: { email: string; username: string; displayName: string; password: string }) => {
			const data = await api.register(input);
			setUser(data.user);
		},
		[],
	);

	const logout = useCallback(async () => {
		await api.logout();
		setUser(null);
	}, []);

	const value = useMemo<AuthState>(
		() => ({ user, loading, login, register, logout }),
		[user, loading, login, register, logout],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) throw new Error("useAuth precisa estar dentro de AuthProvider.");
	return context;
}
