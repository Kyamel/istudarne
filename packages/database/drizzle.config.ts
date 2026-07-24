import { defineConfig } from "drizzle-kit";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(packageDir, "./");

loadEnvIfMissing(resolve(rootDir, ".env"));
loadEnvIfMissing(resolve(rootDir, "../../apps/api/.dev.vars"));

if (!process.env.DATABASE_URL) {
	throw new Error("DATABASE_URL is not set");
}

export default defineConfig({
	schema: "./src/schema/index.ts",
	out: "./migrations",
	dialect: "postgresql",
	dbCredentials: { url: process.env.DATABASE_URL },
	strict: true,
	verbose: true,
});

function loadEnvIfMissing(path: string) {
	if (process.env.DATABASE_URL || !existsSync(path)) return;
	process.loadEnvFile(path);
}
