import { createDatabase } from "./db/client";
import { createRepositories } from "./repositories";
import { createAiJobRepository } from "./repositories/aiJobRepository";
import { createStorageRepository } from "./repositories/storageRepository";
import { createAiService } from "./services/aiService";
import { createAttemptService } from "./services/attemptService";
import { createAuthService } from "./services/authService";
import { createEmailService } from "./services/emailService";
import { createGroupService } from "./services/groupService";
import { createProfileService } from "./services/profileService";
import { createQuizService } from "./services/quizService";

/**
 * Dependency injection container built once per request. The Drizzle connection
 * is opened here and shared by all repositories and services, so handlers do
 * not recreate the connection.
 */
export function createContainer(env: Env) {
	const db = createDatabase(env.DB);
	const repositories = createRepositories(db);
	const aiJobs = createAiJobRepository(db);
	const storage = createStorageRepository(env.QUIZ_FILES);

	const services = {
		auth: createAuthService(repositories.users, env.JWT_SECRET),
		email: createEmailService({ apiKey: env.RESEND_API_KEY, from: env.EMAIL_FROM }),
		quiz: createQuizService(repositories.quizzes, storage),
		attempt: createAttemptService(repositories.attempts, repositories.quizzes),
		profile: createProfileService(repositories.social, repositories.users),
		group: createGroupService(repositories.groups),
		ai: createAiService(aiJobs, storage, env.AI_QUEUE),
	};

	return { env, db, repositories, aiJobs, storage, services };
}

export type Container = ReturnType<typeof createContainer>;
