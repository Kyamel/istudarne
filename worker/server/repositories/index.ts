import type { Database } from "../db/client";
import { createAttemptRepository } from "./attemptRepository";
import { createGroupRepository } from "./groupRepository";
import { createQuizRepository } from "./quizRepository";
import { createSocialRepository } from "./socialRepository";
import { createStatsRepository } from "./statsRepository";
import { createUserRepository } from "./userRepository";

export function createRepositories(db: Database) {
	return {
		users: createUserRepository(db),
		quizzes: createQuizRepository(db),
		attempts: createAttemptRepository(db),
		stats: createStatsRepository(db),
		social: createSocialRepository(db),
		groups: createGroupRepository(db),
	};
}

export type Repositories = ReturnType<typeof createRepositories>;
