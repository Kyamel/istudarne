import {
	createAuth as createAuthModule,
	DEFAULT_AUTH_POLICY,
} from "@istudarne/auth";
import {
	authAccount,
	authRateLimit,
	authSession,
	authUser,
	authVerification,
	createDatabase,
	users,
} from "@istudarne/database";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthEmailSender } from "./email";

/**
 * Host wiring for the self-contained `@istudarne/auth` module: it builds the
 * Better Auth instance from the request env, plugging in the Drizzle adapter,
 * the Resend email sender, and a `user.create` hook that provisions the domain
 * profile (`users`) whenever Better Auth creates an auth user. The instance is
 * cached across requests keyed by the config it depends on.
 */
type AuthInstance = ReturnType<typeof createAuthModule>;
type Session = Awaited<ReturnType<AuthInstance["api"]["getSession"]>>;

export type SessionUser = NonNullable<Session>["user"];
export type SessionData = NonNullable<Session>["session"];
export type DomainUser = typeof users.$inferSelect;

let cachedAuth: AuthInstance | undefined;
let cachedKey: string | undefined;

const LOCAL_DEV_ORIGINS = Array.from({ length: 8 }, (_, index) => index + 5173).flatMap((port) => [
	`http://localhost:${port}`,
	`http://127.0.0.1:${port}`,
]);

function isLocalURL(value: string): boolean {
	try {
		const hostname = new URL(value).hostname;
		return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
	} catch {
		return false;
	}
}

function parseOrigins(value: string | undefined, authBaseURL: string): string[] {
	const origins = (value ?? "")
		.split(",")
		.map((entry) => entry.trim())
		.filter(Boolean);

	if (isLocalURL(authBaseURL)) {
		origins.push(...LOCAL_DEV_ORIGINS);
	}

	return Array.from(new Set(origins));
}

export function createAuth(env: Env): AuthInstance {
	const key = [
		env.AUTH_BASE_URL,
		env.DATABASE_URL,
		env.BETTER_AUTH_SECRET,
		env.ALLOWED_ORIGINS ?? "",
	].join("\0");

	if (cachedAuth && cachedKey === key) {
		return cachedAuth;
	}

	const db = createDatabase(env.DATABASE_URL);

	cachedAuth = createAuthModule({
		baseURL: env.AUTH_BASE_URL,
		basePath: "/api/auth",
		secret: env.BETTER_AUTH_SECRET,
		trustedOrigins: parseOrigins(env.ALLOWED_ORIGINS, env.AUTH_BASE_URL),
		database: drizzleAdapter(db, {
			provider: "pg",
			schema: {
				user: authUser,
				session: authSession,
				account: authAccount,
				verification: authVerification,
				rateLimit: authRateLimit,
			},
		}),
		policy: DEFAULT_AUTH_POLICY,
		emails: createAuthEmailSender({ apiKey: env.RESEND_API_KEY, from: env.EMAIL_FROM }),
		databaseHooks: {
			user: {
				create: {
					// Provision the domain profile once per auth user. Idempotent so a
					// retried signup never inserts a second profile row.
					after: async (user, ctx) => {
						const existing = await db.query.users.findFirst({
							columns: { id: true },
							where: (table, { eq }) => eq(table.authUserId, user.id),
						});
						if (existing) return;

						const body = ctx?.body as { username?: unknown; displayName?: unknown } | undefined;
						await db.insert(users).values({
							id: crypto.randomUUID(),
							authUserId: user.id,
							username: createInitialUsername(user, body?.username),
							displayName: createInitialDisplayName(user, body?.displayName),
						});
					},
				},
			},
		},
	});
	cachedKey = key;

	return cachedAuth;
}

function createInitialDisplayName(
	user: { name?: string | null; email?: string | null },
	requested?: unknown,
): string {
	const name = (typeof requested === "string" ? requested : user.name)?.trim();
	if (name) return name;
	return user.email?.split("@")[0]?.trim() || "New member";
}

function createInitialUsername(user: {
	id: string;
	name?: string | null;
	email?: string | null;
}, requested?: unknown): string {
	const base =
		normalizeUsernamePart(
			(typeof requested === "string" && requested) || user.name || user.email?.split("@")[0] || "user",
		) || "user";
	const suffix = normalizeUsernamePart(user.id).slice(0, 10) || crypto.randomUUID().slice(0, 8);
	return `${base}-${suffix}`;
}

function normalizeUsernamePart(value: string): string {
	return value
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 40);
}
