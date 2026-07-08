export type Visibility = "private" | "public" | "unlisted";
export type GroupVisibility = "public" | "private" | "invite";
export type GroupRole = "owner" | "moderator" | "member";
export type AttemptMode = "practice" | "exam" | "review";

export type AuthUser = {
	id: string;
	email: string;
	username: string;
	displayName: string;
	bio: string | null;
	avatarUrl: string | null;
	emailVerified: boolean;
};

export type QuizSummary = {
	id: string;
	title: string;
	description: string | null;
	visibility: Visibility;
	questionCount: number;
	playsCount: number;
	ownerUsername: string;
	ownerDisplayName: string;
	tags: string[];
};

export type QuizQuestion = {
	id: string;
	topic: string | null;
	statement: string;
	answer: string;
	explanation: string | null;
	options: { id: string; key: string; text: string }[];
};

export type QuizDetail = QuizSummary & {
	ownerId: string;
	questions: QuizQuestion[];
};

export type UserStats = {
	questionsToday: number;
	questionsTotal: number;
	accuracy: number;
	streak: number;
	points: number;
	quizzesOwned: number;
	attempts: number;
};

export type HistoryEntry = {
	attemptId: string;
	quizId: string;
	quizTitle: string;
	mode: string;
	status: string;
	score: number;
	correctCount: number;
	wrongCount: number;
	startedAt: number;
	finishedAt: number | null;
};

export type Profile = {
	id: string;
	username: string;
	displayName: string;
	bio: string | null;
	avatarUrl: string | null;
	followers: number;
	following: number;
	stats: UserStats;
	quizzes: QuizSummary[];
	isFollowing: boolean;
};

export type GroupSummary = {
	id: string;
	name: string;
	description: string | null;
	visibility: GroupVisibility;
	memberCount: number;
	isMember: boolean;
	role: GroupRole | null;
};

export type GroupMember = {
	userId: string;
	role: string;
	username: string;
	displayName: string;
};

export type GroupDetail = {
	id: string;
	name: string;
	description: string | null;
	visibility: GroupVisibility;
	ownerId: string;
	role: GroupRole | null;
	members: GroupMember[];
	quizzes: QuizSummary[];
};

export type ChatMessage = {
	id: string;
	body: string;
	senderId: string;
	displayName: string;
	createdAt: number;
};
