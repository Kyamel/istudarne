import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export type Database = ReturnType<typeof drizzle<typeof schema>>;

/**
 * Creates the Drizzle connection once per request. The result should be shared
 * through the dependency injection container instead of recreated by each query.
 */
export function createDatabase(d1: D1Database): Database {
	return drizzle(d1, { schema });
}
