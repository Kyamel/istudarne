import { z } from "zod";
import { quizSummarySchema } from "./quizzes";
import { userStatsSchema } from "./stats";

export const profileSchema = z.object({
	id: z.string(),
	username: z.string(),
	displayName: z.string(),
	bio: z.string().nullable(),
	avatarUrl: z.string().nullable(),
	followers: z.number().int().nonnegative(),
	following: z.number().int().nonnegative(),
	stats: userStatsSchema,
	quizzes: z.array(quizSummarySchema),
	isFollowing: z.boolean(),
});

export const profileResponseSchema = z.object({
	profile: profileSchema,
});

export type Profile = z.infer<typeof profileSchema>;
