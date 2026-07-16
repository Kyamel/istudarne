import { defineConfig } from "drizzle-kit";

// `dbCredentials.url` is only consulted by migrate/push/studio; `generate`
// works offline, so an empty URL here is fine for CI schema generation.
export default defineConfig({
	schema: "./src/schema/index.ts",
	out: "./migrations",
	dialect: "postgresql",
	dbCredentials: { url: process.env.DATABASE_URL ?? "" },
	strict: true,
	verbose: true,
});
