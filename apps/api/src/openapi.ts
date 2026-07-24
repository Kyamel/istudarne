import { z } from "@hono/zod-openapi";
import { type Auth, getAuthOpenAPISchema } from "@istudarne/auth";

type OpenAPIRecord = Record<string, unknown>;

type OpenAPIDocument = OpenAPIRecord & {
	paths?: Record<string, unknown>;
	components?: OpenAPIRecord & {
		schemas?: Record<string, unknown>;
		securitySchemes?: Record<string, unknown>;
	};
	tags?: unknown[];
};

/* ------------------------------ shared pieces ------------------------------ */

export const ErrorResponseSchema = z
	.object({
		error: z.string().openapi({ example: "Resource not found." }),
	})
	.openapi("ErrorResponse");

/** JSON request body descriptor for createRoute. */
export const jsonBody = <T extends z.ZodType>(schema: T) => ({
	required: true,
	content: { "application/json": { schema } },
});

/** JSON response descriptor for createRoute. */
export const jsonResponse = <T extends z.ZodType>(schema: T, description: string) => ({
	description,
	content: { "application/json": { schema } },
});

/** Error response descriptor (all errors share the `{ error }` JSON shape). */
export const errorResponse = (description: string) => ({
	description,
	content: { "application/json": { schema: ErrorResponseSchema } },
});

/** Marks a route as authenticated in the OpenAPI document via the web session cookie. */
export const authSecurity: Record<string, string[]>[] = [{ CookieAuth: [] }];

/* ------------------------------ path params ------------------------------- */

export const IdParamsSchema = z.object({
	id: z.string().openapi({
		param: { name: "id", in: "path" },
		example: "bb73ccde-e174-4290-874a-a34f4fb6dc54",
	}),
});

export const UsernameParamsSchema = z.object({
	username: z.string().openapi({
		param: { name: "username", in: "path" },
		example: "demo",
	}),
});

export const GroupIdParamsSchema = z.object({
	groupId: z.string().openapi({
		param: { name: "groupId", in: "path" },
		example: "hci-group",
	}),
});

export const JobIdParamsSchema = z.object({
	jobId: z.string().openapi({
		param: { name: "jobId", in: "path" },
		example: "0d5ffb96-6a53-4f5e-9464-3e02a1a1ed21",
	}),
});

/* ------------------------------- document --------------------------------- */

export const openApiDocument = {
	openapi: "3.1.0",
	info: {
		title: "Istudarne API",
		version: "0.2.0",
		description:
			"Istudarne serverless API for quizzes, JSON uploads, public search, community features, and async AI jobs. " +
			"Authentication is handled by Better Auth with stateful Postgres sessions and httpOnly cookies.",
	},
	servers: [
		{
			url: "/",
			description: "Current environment",
		},
	],
};

export async function mergeAuthOpenApiDocument(
	appDocumentInput: object,
	auth: Auth,
): Promise<OpenAPIDocument> {
	const appDocument = appDocumentInput as OpenAPIDocument;
	const authDocument = await getAuthOpenAPISchema(auth);
	const schemaNameMap = createSchemaNameMap(Object.keys(authDocument.components.schemas));

	return {
		...appDocument,
		paths: {
			...(appDocument.paths ?? {}),
			...prefixAuthPaths(authDocument.paths, schemaNameMap),
		},
		components: {
			...(appDocument.components ?? {}),
			schemas: {
				...(appDocument.components?.schemas ?? {}),
				...prefixAuthSchemas(authDocument.components.schemas, schemaNameMap),
			},
			securitySchemes: {
				...(appDocument.components?.securitySchemes ?? {}),
				CookieAuth: {
					type: "apiKey",
					in: "cookie",
					name: "better-auth.session_token",
					description: "Better Auth session cookie set on sign-in (web app).",
				},
			},
		},
		tags: mergeTags(appDocument.tags, [
			{ name: "Auth", description: "Better Auth account, session, and password endpoints." },
		]),
	};
}

function createSchemaNameMap(names: string[]): Record<string, string> {
	return Object.fromEntries(names.map((name) => [name, `Auth${name}`]));
}

function prefixAuthPaths(
	paths: Record<string, unknown>,
	schemaNameMap: Record<string, string>,
): Record<string, unknown> {
	return Object.fromEntries(
		Object.entries(paths).map(([path, pathItem]) => [
			`/api/auth${path}`,
			rewriteAuthOpenApiValue(pathItem, schemaNameMap),
		]),
	);
}

function prefixAuthSchemas(
	schemas: Record<string, unknown>,
	schemaNameMap: Record<string, string>,
): Record<string, unknown> {
	return Object.fromEntries(
		Object.entries(schemas).map(([name, schema]) => [
			schemaNameMap[name] ?? name,
			rewriteAuthOpenApiValue(schema, schemaNameMap),
		]),
	);
}

function rewriteAuthOpenApiValue(value: unknown, schemaNameMap: Record<string, string>): unknown {
	if (Array.isArray(value)) {
		return value.map((entry) => rewriteAuthOpenApiValue(entry, schemaNameMap));
	}
	if (!isRecord(value)) {
		return value;
	}

	const rewritten: OpenAPIRecord = {};
	for (const [key, entry] of Object.entries(value)) {
		if (key === "$ref" && typeof entry === "string") {
			rewritten[key] = rewriteSchemaRef(entry, schemaNameMap);
			continue;
		}
		if (key === "security") {
			rewritten[key] = rewriteAuthSecurity(entry);
			continue;
		}
		if (key === "tags" && isStringArray(entry)) {
			rewritten[key] = ["Auth"];
			continue;
		}
		rewritten[key] = rewriteAuthOpenApiValue(entry, schemaNameMap);
	}
	return rewritten;
}

function rewriteSchemaRef(ref: string, schemaNameMap: Record<string, string>): string {
	const schemaPrefix = "#/components/schemas/";
	if (!ref.startsWith(schemaPrefix)) return ref;

	const schemaName = ref.slice(schemaPrefix.length);
	return `${schemaPrefix}${schemaNameMap[schemaName] ?? schemaName}`;
}

function rewriteAuthSecurity(value: unknown): unknown {
	if (!Array.isArray(value)) return value;

	return value.map((entry) => {
		if (!isRecord(entry)) return entry;

		return Object.fromEntries(
			Object.entries(entry).map(([scheme, scopes]) => [
				scheme === "apiKeyCookie" ? "CookieAuth" : scheme,
				scopes,
			]),
		);
	});
}

function mergeTags(existing: unknown[] | undefined, additional: OpenAPIRecord[]): OpenAPIRecord[] {
	const tags = [...((existing ?? []).filter(isRecord) as OpenAPIRecord[]), ...additional];
	const seen = new Set<string>();

	return tags.filter((tag) => {
		const name = tag.name;
		if (typeof name !== "string" || seen.has(name)) return false;
		seen.add(name);
		return true;
	});
}

function isRecord(value: unknown): value is OpenAPIRecord {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
	return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}
