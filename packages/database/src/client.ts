import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export type Database = ReturnType<typeof drizzle<typeof schema>>;

/**
 * Opens the Neon/Drizzle connection. Cheap (HTTP driver, no socket), but the
 * result should still be shared through the request container instead of being
 * recreated per query.
 */
export function createDatabase(databaseUrl: string): Database {
	return drizzle(neon(databaseUrl), { schema });
}
