import { cloudflare } from "@cloudflare/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

// The i18n output (@istudarne/utils/paraglide) is compiled once by the root
// `i18n:compile` script (with .d.ts) and consumed by both apps. The paraglide
// Vite plugin is intentionally NOT used here: it would rewrite the output without
// the declarations that apps/api's type build depends on. Re-run `pnpm i18n:compile`
// after changing messages.
export default defineConfig({
	plugins: [cloudflare({ viteEnvironment: { name: "ssr" } }), tailwindcss(), reactRouter()],
	resolve: {
		tsconfigPaths: true,
	},
});
