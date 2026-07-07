import type { Database } from "../db/client";
import type { GroupVisibility } from "../domain/types";
import { createGroup } from "../queries/groups/createGroup";
import { getGroupDetail } from "../queries/groups/getGroupDetail";
import { getGroupMembership } from "../queries/groups/getGroupMembership";
import { insertChatMessage } from "../queries/groups/insertChatMessage";
import { joinGroup } from "../queries/groups/joinGroup";
import { leaveGroup } from "../queries/groups/leaveGroup";
import { listGroupMessages } from "../queries/groups/listGroupMessages";
import { listGroups } from "../queries/groups/listGroups";
import { shareQuizToGroup } from "../queries/groups/shareQuizToGroup";

export function createGroupRepository(db: Database) {
	return {
		create: (input: {
			ownerId: string;
			name: string;
			description?: string | null;
			visibility: GroupVisibility;
		}) => createGroup(db, input),
		listForViewer: (viewerId: string) => listGroups(db, viewerId),
		membership: (groupId: string, userId: string) => getGroupMembership(db, groupId, userId),
		detail: (groupId: string, viewerId: string) => getGroupDetail(db, groupId, viewerId),
		join: (groupId: string, userId: string) => joinGroup(db, groupId, userId),
		leave: (groupId: string, userId: string) => leaveGroup(db, groupId, userId),
		shareQuiz: (input: { groupId: string; quizId: string; sharedBy: string }) =>
			shareQuizToGroup(db, input),
		messages: (groupId: string) => listGroupMessages(db, groupId),
		addMessage: (input: { id: string; groupId: string; senderId: string; body: string }) =>
			insertChatMessage(db, input),
	};
}

export type GroupRepository = ReturnType<typeof createGroupRepository>;
