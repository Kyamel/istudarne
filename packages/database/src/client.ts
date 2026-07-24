import { neon } from "@neondatabase/serverless";
import { Pool as NeonPool } from "@neondatabase/serverless";
import { drizzle as drizzleNeonHttp } from "drizzle-orm/neon-http";
import { drizzle as drizzleNeonServerless } from "drizzle-orm/neon-serverless";
import { drizzle as drizzleNodePostgres } from "drizzle-orm/node-postgres";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

export type DatabaseDriver = "auto" | "neon-http" | "neon-serverless" | "node-postgres";

export type CreateDatabaseOptions = {
	driver?: DatabaseDriver;
};

const REMOTE_DRIVER: Exclude<DatabaseDriver, "auto"> = "neon-http";

export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

/**
 * Opens the Drizzle connection. Local Postgres URLs use node-postgres; remote
 * URLs keep the stateless Neon HTTP driver unless DATABASE_DRIVER overrides it.
 */
export function createDatabase(
	databaseUrl: string,
	options: CreateDatabaseOptions = {},
): Database {
	const driver = resolveDatabaseDriver(databaseUrl, options.driver);

	if (driver === "node-postgres") {
		const pool = new Pool({
			connectionString: databaseUrl,
			max: 1,
			idleTimeoutMillis: 10_000,
			allowExitOnIdle: true,
		});
		return drizzleNodePostgres(pool, { schema });
	}

	if (driver === "neon-serverless") {
		const pool = new NeonPool({ connectionString: databaseUrl, max: 1 });
		return drizzleNeonServerless(pool, { schema });
	}

	return drizzleNeonHttp(neon(databaseUrl), { schema });
}

export function resolveDatabaseDriver(
	databaseUrl: string,
	requested: DatabaseDriver = "auto",
): Exclude<DatabaseDriver, "auto"> {
	if (requested !== "auto") return requested;

	const envDriver = process.env.DATABASE_DRIVER;
	if (isDatabaseDriver(envDriver) && envDriver !== "auto") {
		return envDriver;
	}

	return isLocalPostgresUrl(databaseUrl) ? "node-postgres" : REMOTE_DRIVER;
}

function isDatabaseDriver(value: unknown): value is DatabaseDriver {
	return (
		value === "auto" ||
		value === "neon-http" ||
		value === "neon-serverless" ||
		value === "node-postgres"
	);
}

function isLocalPostgresUrl(databaseUrl: string): boolean {
	try {
		const hostname = new URL(databaseUrl).hostname.toLowerCase();
		return (
			hostname === "localhost" ||
			hostname === "127.0.0.1" ||
			hostname === "::1" ||
			hostname === "0.0.0.0" ||
			hostname === "host.docker.internal" ||
			hostname === "postgres" ||
			hostname === "db"
		);
	} catch {
		return (
			databaseUrl.includes("/var/run/postgresql") ||
			databaseUrl.includes("/run/postgresql")
		);
	}
}
