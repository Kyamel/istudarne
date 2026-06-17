import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export type Database = ReturnType<typeof drizzle<typeof schema>>;

/**
 * Cria a conexão Drizzle uma única vez por requisição. O resultado deve ser
 * compartilhado via container de injeção de dependências, e não recriado a
 * cada chamada de query.
 */
export function createDatabase(d1: D1Database): Database {
	return drizzle(d1, { schema });
}
