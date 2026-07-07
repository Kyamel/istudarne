import type { App } from "../env";
import { registerAnswerAttempt } from "./attempts/answer";
import { registerCreateAttempt } from "./attempts/create";
import { registerFinishAttempt } from "./attempts/finish";
import { registerLogin } from "./auth/login";
import { registerLogout } from "./auth/logout";
import { registerMe } from "./auth/me";
import { registerRegister } from "./auth/register";
import { registerGroupChat } from "./groups/chat";
import { registerCreateGroup } from "./groups/create";
import { registerGroupDetail } from "./groups/detail";
import { registerListGroups } from "./groups/list";
import { registerJoinGroup, registerLeaveGroup } from "./groups/membership";
import { registerGroupMessages } from "./groups/messages";
import { registerShareQuiz } from "./groups/shareQuiz";
import { registerHealth } from "./health";
import { registerMyHistory } from "./me/history";
import { registerMyStats } from "./me/stats";
import { registerQuizDetail } from "./quizzes/detail";
import { registerExportQuiz } from "./quizzes/export";
import { registerListMyQuizzes } from "./quizzes/listMine";
import { registerPatchQuiz } from "./quizzes/patch";
import { registerDeleteQuiz } from "./quizzes/remove";
import { registerSearchQuizzes } from "./quizzes/search";
import { registerUploadQuiz } from "./quizzes/upload";
import { registerPublishQuiz, registerUnpublishQuiz } from "./quizzes/visibility";
import { registerFollow, registerUnfollow } from "./users/follow";
import { registerProfile } from "./users/profile";

/** Registers all API routes (one route registration function per route file). */
export function registerApiRoutes(app: App) {
	registerHealth(app);

	registerRegister(app);
	registerLogin(app);
	registerLogout(app);
	registerMe(app);

	// Specific routes must be registered before parametric routes to avoid route collisions.
	registerSearchQuizzes(app);
	registerUploadQuiz(app);
	registerListMyQuizzes(app);
	registerMyStats(app);
	registerMyHistory(app);
	registerQuizDetail(app);
	registerExportQuiz(app);
	registerPatchQuiz(app);
	registerDeleteQuiz(app);
	registerPublishQuiz(app);
	registerUnpublishQuiz(app);

	registerCreateAttempt(app);
	registerAnswerAttempt(app);
	registerFinishAttempt(app);

	registerProfile(app);
	registerFollow(app);
	registerUnfollow(app);

	registerListGroups(app);
	registerCreateGroup(app);
	registerGroupDetail(app);
	registerJoinGroup(app);
	registerLeaveGroup(app);
	registerShareQuiz(app);
	registerGroupMessages(app);
	registerGroupChat(app);
}
