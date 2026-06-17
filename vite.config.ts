import { cloudflare } from "@cloudflare/vite-plugin";
import { paraglideVitePlugin } from "@inlang/paraglide-js";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [
		paraglideVitePlugin({
			project: "./project.inlang",
			outdir: "./app/paraglide",
			strategy: ["localStorage", "preferredLanguage", "baseLocale"],
		}),
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
