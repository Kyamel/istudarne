import type { LinksFunction, MetaFunction } from "react-router";
import {
	isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useRouteError,
} from "react-router";
import { AuthProvider } from "~/auth/context";
import stylesheet from "./styles/app.css?url";

export const links: LinksFunction = () => [{ rel: "stylesheet", href: stylesheet }];

export const meta: MetaFunction = () => [{ title: "Istudarne" }];

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="pt-BR">
			<head>
				<meta charSet="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
				<meta name="theme-color" content="#202020" />
				<Meta />
				<Links />
			</head>
			<body>
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function Root() {
	return (
		<AuthProvider>
			<Outlet />
		</AuthProvider>
	);
}

export function ErrorBoundary() {
	const error = useRouteError();
	const message = isRouteErrorResponse(error)
		? `${error.status} ${error.statusText}`
		: "Unexpected error";

	return (
		<main style={{ display: "grid", placeItems: "center", minHeight: "100vh", padding: "2rem" }}>
			<h1>{message}</h1>
		</main>
	);
}
