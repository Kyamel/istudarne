import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { users } from "./users";

export const pointsEvents = sqliteTable(
	"points_events",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		type: text("type").notNull(),
		points: integer("points").notNull(),
		metadataJson: text("metadata_json"),
		createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
	},
	(table) => ({
		userIdx: index("points_events_user_idx").on(table.userId),
	}),
);
