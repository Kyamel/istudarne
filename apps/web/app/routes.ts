import { index, layout, prefix, type RouteConfig, route } from "@react-router/dev/routes";

export default [
	index("routes/home.tsx"),
	route("login", "routes/login.tsx"),
	...prefix("app", [
		layout("routes/app-shell.tsx", [
			index("routes/dashboard.tsx"),
			route("quizzes", "routes/quizzes.tsx"),
			route("quizzes/:quizId/play", "routes/quiz.tsx"),
			route("upload", "routes/upload.tsx"),
			route("groups", "routes/groups.tsx"),
			route("groups/:groupId", "routes/group.tsx"),
			route("users/:username", "routes/profile.tsx"),
		]),
	]),
	route("*", "routes/not-found.tsx"),
] satisfies RouteConfig;
