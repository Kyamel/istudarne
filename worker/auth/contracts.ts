/**
 * Auth module — shared contracts (zod schemas + types).
 *
 * ADAPT PER PROJECT: `authUserSchema`/`AuthUser` and `registerRequestSchema`
 * carry the profile fields of THIS app (username, displayName, bio,
 * avatarUrl). When copying the module, trim or extend them here and in your
 * AuthStore implementation — everything else is project-agnostic.
 */
import { z } from "zod";

export const currentUserSchema = z.object({
	id: z.string(),
	email: z.email(),
	username: z.string(),
	displayName: z.string(),
	bio: z.string().nullable(),
	avatarUrl: z.string().nullable(),
	emailVerified: z.boolean(),
});

export const registerRequestSchema = z.object({
	email: z.email(),
	username: z
		.string()
		.min(3)
		.max(24)
		.regex(/^[a-z0-9_]+$/i, "Use only letters, numbers, or _."),
	displayName: z.string().min(2).max(60),
	password: z.string().min(8).max(128),
});

export const loginRequestSchema = z.object({
	email: z.email(),
	password: z.string().min(1),
});

/**
 * Tokens returned on login/refresh. Web clients can ignore them (the same
 * tokens are set as httpOnly cookies); native clients store them and send the
 * access token as an `Authorization: Bearer` header.
 */
export const authTokensSchema = z.object({
	accessToken: z.string(),
	refreshToken: z.string(),
	/** Access-token lifetime in seconds. */
	expiresIn: z.number().int().positive(),
	tokenType: z.literal("Bearer"),
});

export const authUserResponseSchema = z.object({
	user: currentUserSchema,
});

export const authSessionResponseSchema = z.object({
	user: currentUserSchema,
	tokens: authTokensSchema,
});

/** Native clients send the refresh token in the body; web clients rely on the cookie. */
export const refreshRequestSchema = z.object({
	refreshToken: z.string().min(1).optional(),
});

/**
 * `tokens` is only present when the refresh token came in the request body
 * (native clients). Cookie-transport clients get the new pair exclusively as
 * httpOnly cookies — echoing it in JSON would let page scripts (XSS) read the
 * long-lived refresh token.
 */
export const refreshResponseSchema = z.object({
	user: currentUserSchema,
	tokens: authTokensSchema.optional(),
});

export const verifyEmailRequestSchema = z.object({
	token: z.string().min(1),
});

/** Unauthenticated on purpose: an unverified account cannot sign in to ask. */
export const resendVerificationRequestSchema = z.object({
	email: z.email(),
});

export const okResponseSchema = z.object({
	ok: z.literal(true),
});

export type CurrentUser = z.infer<typeof currentUserSchema>;
export type AuthUser = CurrentUser;
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type AuthTokens = z.infer<typeof authTokensSchema>;
