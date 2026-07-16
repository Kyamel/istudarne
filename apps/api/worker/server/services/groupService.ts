import type { GroupVisibility } from "../domain/types";
import { forbidden, notFound } from "../errors";
import type { GroupRepository } from "../repositories/groupRepository";

export function createGroupService(groups: GroupRepository) {
	async function assertMember(groupId: string, userId: string) {
		const role = await groups.membership(groupId, userId);
		if (!role) throw forbidden("You are not a member of this group.");
		return role;
	}

	return {
		list: (viewerId: string) => groups.listForViewer(viewerId),

		create: (input: {
			ownerId: string;
			name: string;
			description?: string | null;
			visibility: GroupVisibility;
		}) => groups.create(input),

		async detail(groupId: string, viewerId: string) {
			const detail = await groups.detail(groupId, viewerId);
			if (!detail) throw notFound("Group not found.");
			if (detail.visibility !== "public" && !detail.role) {
				throw forbidden("Private group.");
			}
			return detail;
		},

		join: (groupId: string, userId: string) => groups.join(groupId, userId),
		leave: (groupId: string, userId: string) => groups.leave(groupId, userId),

		async shareQuiz(groupId: string, userId: string, quizId: string) {
			await assertMember(groupId, userId);
			await groups.shareQuiz({ groupId, quizId, sharedBy: userId });
		},

		async messages(groupId: string, userId: string) {
			await assertMember(groupId, userId);
			return groups.messages(groupId);
		},

		membership: (groupId: string, userId: string) => groups.membership(groupId, userId),
	};
}

export type GroupService = ReturnType<typeof createGroupService>;
