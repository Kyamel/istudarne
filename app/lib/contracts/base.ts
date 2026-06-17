import { z } from "zod";

export const visibilitySchema = z.enum(["private", "public", "unlisted"]);
export const groupVisibilitySchema = z.enum(["public", "private", "invite"]);
export const groupRoleSchema = z.enum(["owner", "moderator", "member"]);
export const attemptModeSchema = z.enum(["practice", "exam", "review"]);

export const okResponseSchema = z.object({
	ok: z.literal(true),
});

export type Visibility = z.infer<typeof visibilitySchema>;
export type GroupVisibility = z.infer<typeof groupVisibilitySchema>;
export type GroupRole = z.infer<typeof groupRoleSchema>;
export type AttemptMode = z.infer<typeof attemptModeSchema>;
