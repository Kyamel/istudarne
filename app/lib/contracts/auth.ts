import { z } from "zod";

export const currentUserSchema = z.object({
	id: z.string(),
	email: z.email(),
	username: z.string(),
	displayName: z.string(),
	bio: z.string().nullable(),
	avatarUrl: z.string().nullable(),
});

export const registerRequestSchema = z.object({
	email: z.string().email(),
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

export const authUserResponseSchema = z.object({
	user: currentUserSchema,
});

export type CurrentUser = z.infer<typeof currentUserSchema>;
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
