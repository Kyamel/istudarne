import type { Database } from "../db/client";
import { getUserHistory } from "../queries/stats/getUserHistory";
import { getUserStats } from "../queries/stats/getUserStats";

export function createStatsRepository(db: Database) {
	return {
		forUser: (userId: string) => getUserStats(db, userId),
		historyForUser: (userId: string) => getUserHistory(db, userId),
	};
}

export type StatsRepository = ReturnType<typeof createStatsRepository>;
