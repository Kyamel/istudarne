const DEFAULT_DEV_API_BASE = "http://localhost:8787";

export const API_BASE: string =
	import.meta.env.VITE_API_BASE ?? (import.meta.env.DEV ? DEFAULT_DEV_API_BASE : "");
