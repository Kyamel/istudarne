import type { Config } from "@react-router/dev/config";

export default {
	appDirectory: "src",
	// Server-side render by default; routes can opt out per-route. A SPA/prerender
	// build for the Capacitor shell is produced with `ssr: false` at build time.
	ssr: true,
} satisfies Config;
