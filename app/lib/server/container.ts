import { createDatabase } from "./db/client";
import { createRepositories } from "./repositories";
import { createStorageRepository } from "./repositories/storageRepository";
import { createAttemptService } from "./services/attemptService";
import { createAuthService } from "./services/authService";
import { createGroupService } from "./services/groupService";
import { createProfileService } from "./services/profileService";
import { createQuizService } from "./services/quizService";

/**
 * Container de injeção de dependências montado uma única vez por requisição.
 * A conexão Drizzle é aberta aqui e compartilhada por todos os repositórios e
 * serviços — nenhum handler deve recriar a conexão.
 */
export function createContainer(env: Env) {
	const db = createDatabase(env.DB);
	const repositories = createRepositories(db);
	const storage = createStorageRepository(env.QUIZ_FILES);

	const services = {
		auth: createAuthService(repositories.users),
		quiz: createQuizService(repositories.quizzes, storage),
		attempt: createAttemptService(repositories.attempts, repositories.quizzes),
		profile: createProfileService(repositories.social, repositories.users),
		group: createGroupService(repositories.groups),
	};

	return { env, db, repositories, services };
}

export type Container = ReturnType<typeof createContainer>;
