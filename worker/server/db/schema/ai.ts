import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { users } from "./users";

/**
 * Async AI jobs processed by the Cloudflare Queue consumer. The request only
 * enqueues the job (fast path, well under the Workers CPU budget); the OpenAI
 * call happens in the consumer, and the payload/result JSON live in R2.
 */
export const aiJobs = sqliteTable(
	"ai_jobs",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		kind: text("kind").notNull(),
		status: text("status", { enum: ["queued", "processing", "succeeded", "failed"] })
			.notNull()
			.default("queued"),
		inputKey: text("input_key").notNull(),
		resultKey: text("result_key"),
		error: text("error"),
		createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
		updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
	},
	(table) => [index("ai_jobs_user_idx").on(table.userId)],
);
