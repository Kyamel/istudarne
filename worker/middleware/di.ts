import type { MiddlewareHandler } from "hono";
import { createContainer } from "../../app/lib/server/container";
import type { HonoEnv } from "../env";
import { getSessionToken } from "../http/cookies";

/**
 * Abre a conexão e monta o container de DI uma vez por requisição, além de
 * resolver o usuário autenticado a partir do cookie de sessão.
 */
export const diMiddleware: MiddlewareHandler<HonoEnv> = async (c, next) => {
	const container = createContainer(c.env);
	c.set("container", container);

	const token = getSessionToken(c);
	c.set("user", token ? await container.services.auth.authenticate(token) : null);

	await next();
};
