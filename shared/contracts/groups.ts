import { z } from "zod";
import { groupRoleSchema, groupVisibilitySchema } from "./base";
import { quizSummarySchema } from "./quizzes";

export const groupSummarySchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().nullable(),
	visibility: groupVisibilitySchema,
	memberCount: z.number().int().nonnegative(),
	isMember: z.boolean(),
	role: groupRoleSchema.nullable(),
});

export const groupMemberSchema = z.object({
	userId: z.string(),
	role: z.string(),
	username: z.string(),
	displayName: z.string(),
});

export const groupDetailSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().nullable(),
	visibility: groupVisibilitySchema,
	ownerId: z.string(),
	role: groupRoleSchema.nullable(),
	members: z.array(groupMemberSchema),
	quizzes: z.array(quizSummarySchema),
});

export const chatMessageSchema = z.object({
	id: z.string(),
	body: z.string(),
	senderId: z.string(),
	displayName: z.string(),
	createdAt: z.number(),
});

export const chatInboundMessageSchema = z.object({
	body: z.string().trim().min(1).max(2000),
});

export const chatHistoryEventSchema = z.object({
	type: z.literal("history"),
	messages: z.array(chatMessageSchema),
});

export const chatMessageEventSchema = z.object({
	type: z.literal("message"),
	message: chatMessageSchema,
});

export const chatEventSchema = z.discriminatedUnion("type", [
	chatHistoryEventSchema,
	chatMessageEventSchema,
]);

export const createGroupRequestSchema = z.object({
	name: z.string().min(2).max(80),
	description: z.string().max(600).nullable().optional(),
	visibility: groupVisibilitySchema.default("public"),
});

export const shareQuizRequestSchema = z.object({
	quizId: z.string().min(1),
});

export const groupListResponseSchema = z.object({
	groups: z.array(groupSummarySchema),
});

export const createGroupResponseSchema = z.object({
	id: z.string(),
});

export const groupDetailResponseSchema = z.object({
	group: groupDetailSchema,
});

export const groupMessagesResponseSchema = z.object({
	messages: z.array(chatMessageSchema),
});

export type GroupSummary = z.infer<typeof groupSummarySchema>;
export type GroupDetail = z.infer<typeof groupDetailSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatEvent = z.infer<typeof chatEventSchema>;
export type CreateGroupRequest = z.input<typeof createGroupRequestSchema>;
export type ShareQuizRequest = z.infer<typeof shareQuizRequestSchema>;
