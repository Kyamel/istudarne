import { closeDatabase, createDatabase, type DatabaseDriver } from "./db/client";
import { createRepositories } from "./repositories";
import { createAiJobRepository } from "./repositories/aiJobRepository";
import { createStorageRepository } from "./repositories/storageRepository";
import { createAiService } from "./services/aiService";
import { createAttemptService } from "./services/attemptService";
import { createGroupService } from "./services/groupService";
import { createProfileService } from "./services/profileService";
import { createQuizService } from "./services/quizService";

/**
 * Dependency injection container built once per request. The Drizzle connection
 * is opened here and shared by all repositories and services, so handlers do
 * not recreate the connection. Authentication is handled by the Better Auth
 * instance (src/auth.ts), not through this container.
 */
export function createContainer(env: CloudflareBindings) {
	const db = createDatabase(databaseUrl(env), { driver: databaseDriver(env) });
	const repositories = createRepositories(db);
	const aiJobs = createAiJobRepository(db);
	const storage = createStorageRepository(env.QUIZ_FILES);

	const services = {
		quiz: createQuizService(repositories.quizzes, storage),
		attempt: createAttemptService(repositories.attempts, repositories.quizzes),
		profile: createProfileService(repositories.social, repositories.users),
		group: createGroupService(repositories.groups),
		ai: createAiService(aiJobs, storage, env.AI_QUEUE),
	};

	return { env, db, repositories, aiJobs, storage, services };
}

export type Container = ReturnType<typeof createContainer>;

export async function disposeContainer(container: Container): Promise<void> {
	await closeDatabase(container.db);
}

function databaseDriver(env: CloudflareBindings): DatabaseDriver | undefined {
	return (env as CloudflareBindings & { DATABASE_DRIVER?: DatabaseDriver }).DATABASE_DRIVER;
}

function databaseUrl(env: CloudflareBindings): string {
	return (env as CloudflareBindings & { DATABASE_URL: string }).DATABASE_URL;
}
