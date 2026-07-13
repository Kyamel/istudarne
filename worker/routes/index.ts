import { createAuthApi } from "@api/auth/routes";
import type { App, HonoEnv } from "../env";
import { createAiJobHandler, createAiJobRoute } from "./ai/createJob";
import { getAiJobHandler, getAiJobRoute } from "./ai/getJob";
import { answerAttemptHandler, answerAttemptRoute } from "./attempts/answer";
import { createAttemptHandler, createAttemptRoute } from "./attempts/create";
import { finishAttemptHandler, finishAttemptRoute } from "./attempts/finish";
import { groupChatHandler, groupChatRoute } from "./groups/chat";
import { createGroupHandler, createGroupRoute } from "./groups/create";
import { groupDetailHandler, groupDetailRoute } from "./groups/detail";
import { listGroupsHandler, listGroupsRoute } from "./groups/list";
import {
	joinGroupHandler,
	joinGroupRoute,
	leaveGroupHandler,
	leaveGroupRoute,
} from "./groups/membership";
import { groupMessagesHandler, groupMessagesRoute } from "./groups/messages";
import { shareQuizHandler, shareQuizRoute } from "./groups/shareQuiz";
import { healthHandler, healthRoute } from "./health";
import { myHistoryHandler, myHistoryRoute } from "./me/history";
import { myStatsHandler, myStatsRoute } from "./me/stats";
import { quizDetailHandler, quizDetailRoute } from "./quizzes/detail";
import { exportQuizHandler, exportQuizRoute } from "./quizzes/export";
import { listMyQuizzesHandler, listMyQuizzesRoute } from "./quizzes/listMine";
import { patchQuizHandler, patchQuizRoute } from "./quizzes/patch";
import { deleteQuizHandler, deleteQuizRoute } from "./quizzes/remove";
import { searchQuizzesHandler, searchQuizzesRoute } from "./quizzes/search";
import { uploadQuizHandler, uploadQuizRoute } from "./quizzes/upload";
import {
	publishQuizHandler,
	publishQuizRoute,
	unpublishQuizHandler,
	unpublishQuizRoute,
} from "./quizzes/visibility";
import { followHandler, followRoute, unfollowHandler, unfollowRoute } from "./users/follow";
import { profileHandler, profileRoute } from "./users/profile";

/* Auth endpoints come from the self-contained module in worker/auth/; the
   only wiring is telling it how to reach the per-request services. */
const authApi = createAuthApi<HonoEnv>({
	auth: (c) => c.get("container").services.auth,
	email: (c) => c.get("container").services.email,
});

/**
 * Registers every API route. Each route file exports a `createRoute` definition
 * (which feeds the OpenAPI document / Swagger UI) plus its handler.
 *
 * The calls are chained so the accumulated type describes the whole API: the
 * exported `ApiRoutes` type powers the type-safe RPC client (`hc<ApiRoutes>`)
 * used by the web app — see `app/lib/rpc.ts`.
 */
export function registerApiRoutes(app: App) {
	return (
		app
			.openapi(healthRoute, healthHandler)

			.openapi(authApi.registerRoute, authApi.registerHandler)
			.openapi(authApi.loginRoute, authApi.loginHandler)
			.openapi(authApi.refreshRoute, authApi.refreshHandler)
			.openapi(authApi.logoutRoute, authApi.logoutHandler)
			.openapi(authApi.meRoute, authApi.meHandler)
			.openapi(authApi.verifyEmailLinkRoute, authApi.verifyEmailLinkHandler)
			.openapi(authApi.verifyEmailRoute, authApi.verifyEmailHandler)
			.openapi(authApi.resendVerificationRoute, authApi.resendVerificationHandler)
			.openapi(authApi.passwordResetRequestRoute, authApi.passwordResetRequestHandler)
			.openapi(authApi.passwordResetConfirmRoute, authApi.passwordResetConfirmHandler)

			// Specific routes must be registered before parametric routes to avoid route collisions.
			.openapi(searchQuizzesRoute, searchQuizzesHandler)
			.openapi(uploadQuizRoute, uploadQuizHandler)
			.openapi(listMyQuizzesRoute, listMyQuizzesHandler)
			.openapi(myStatsRoute, myStatsHandler)
			.openapi(myHistoryRoute, myHistoryHandler)
			.openapi(quizDetailRoute, quizDetailHandler)
			.openapi(exportQuizRoute, exportQuizHandler)
			.openapi(patchQuizRoute, patchQuizHandler)
			.openapi(deleteQuizRoute, deleteQuizHandler)
			.openapi(publishQuizRoute, publishQuizHandler)
			.openapi(unpublishQuizRoute, unpublishQuizHandler)

			.openapi(createAttemptRoute, createAttemptHandler)
			.openapi(answerAttemptRoute, answerAttemptHandler)
			.openapi(finishAttemptRoute, finishAttemptHandler)

			.openapi(profileRoute, profileHandler)
			.openapi(followRoute, followHandler)
			.openapi(unfollowRoute, unfollowHandler)

			.openapi(listGroupsRoute, listGroupsHandler)
			.openapi(createGroupRoute, createGroupHandler)
			.openapi(groupDetailRoute, groupDetailHandler)
			.openapi(joinGroupRoute, joinGroupHandler)
			.openapi(leaveGroupRoute, leaveGroupHandler)
			.openapi(shareQuizRoute, shareQuizHandler)
			.openapi(groupMessagesRoute, groupMessagesHandler)
			.openapi(groupChatRoute, groupChatHandler)

			.openapi(createAiJobRoute, createAiJobHandler)
			.openapi(getAiJobRoute, getAiJobHandler)
	);
}

/** Full API surface; consumed by the RPC client (`hc<ApiRoutes>`). */
export type ApiRoutes = ReturnType<typeof registerApiRoutes>;
