import { cloudflare } from "@cloudflare/vite-plugin";
import { paraglideVitePlugin } from "@inlang/paraglide-js";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [
		paraglideVitePlugin({
			project: "./project.inlang",
			outdir: "./shared/paraglide",
			strategy: ["localStorage", "preferredLanguage", "baseLocale"],
		}),
		tailwindcss(),
		react(),
		cloudflare(),
	],
	resolve: {
		tsconfigPaths: true,
	},
	build: {
		outDir: "dist",
	},
});
