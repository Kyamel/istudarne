import type { Auth } from "./create-auth";

export type AuthOpenAPISchema = Awaited<ReturnType<Auth["api"]["generateOpenAPISchema"]>>;

export function getAuthOpenAPISchema(auth: Auth): Promise<AuthOpenAPISchema> {
	return auth.api.generateOpenAPISchema();
}
