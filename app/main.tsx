import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
	BrowserRouter,
	Link,
	Navigate,
	NavLink,
	Route,
	Routes,
	useLocation,
} from "react-router-dom";
import "./styles/app.css";
import { Button, LanguageSwitcher } from "./components";
import styles from "./Layout.module.css";
import { AuthProvider, useAuth } from "./lib/auth-context";
import { cx } from "./lib/classes";
import { m } from "./lib/i18n";
import { DashboardPage } from "./pages/dashboard";
import { GroupPage } from "./pages/group";
import { GroupsPage } from "./pages/groups";
import { LoginPage } from "./pages/login";
import { NotFoundPage } from "./pages/not-found";
import { ProfilePage } from "./pages/profile";
import { QuizPage } from "./pages/quiz";
import { QuizzesPage } from "./pages/quizzes";
import { UploadPage } from "./pages/upload";

function useTheme() {
	const [theme, setTheme] = useState<"light" | "dark">(() => {
		if (typeof window === "undefined") return "dark";
		return window.localStorage.getItem("istudarne-theme") === "light" ? "light" : "dark";
	});

	useEffect(() => {
		document.documentElement.dataset.theme = theme;
		window.localStorage.setItem("istudarne-theme", theme);
	}, [theme]);

	return { theme, setTheme };
}

function Shell() {
	const { theme, setTheme } = useTheme();
	const { user, logout } = useAuth();
	const [navOpen, setNavOpen] = useState(false);

	useEffect(() => {
		const onKey = (event: KeyboardEvent) => event.key === "Escape" && setNavOpen(false);
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);

	const navItems = [
		{ to: "/", label: m.nav_dashboard(), end: true },
		{ to: "/quizzes", label: m.nav_quizzes(), end: false },
		{ to: "/upload", label: m.nav_upload(), end: false },
		{ to: "/groups", label: m.nav_groups(), end: false },
	];

	return (
		<div className={styles.shell} data-nav-open={navOpen}>
			<a className={styles.skipLink} href="#main-content">
				{m.common_skip_to_content()}
			</a>

			<header className={styles.topbar}>
				<button
					aria-controls="primary-navigation"
					aria-expanded={navOpen}
					aria-label={m.nav_open_menu()}
					className={styles.iconButton}
					onClick={() => setNavOpen((open) => !open)}
					type="button"
				>
					<span aria-hidden="true">☰</span>
				</button>
				<Link className={cx(styles.brand, styles.brandCompact)} to="/">
					<span className={styles.brandMark}>I</span>
					<strong>Istudarne</strong>
				</Link>
			</header>

			{navOpen ? (
				<button
					aria-label={m.nav_close_menu()}
					className={styles.backdrop}
					onClick={() => setNavOpen(false)}
					type="button"
				/>
			) : null}

			<aside className={styles.sidebar} id="primary-navigation" aria-label={m.nav_sections()}>
				<Link className={styles.brand} to="/">
					<span className={styles.brandMark}>I</span>
					<span>
						<strong>Istudarne</strong>
						<small>{m.app_tagline()}</small>
					</span>
				</Link>

				<nav className={styles.navList} aria-label={m.nav_sections()}>
					{navItems.map((item) => (
						<NavLink
							key={item.to}
							to={item.to}
							end={item.end}
							className={({ isActive }) => cx(styles.navLink, isActive && styles.activeLink)}
							onClick={() => setNavOpen(false)}
						>
							{item.label}
						</NavLink>
					))}
					{user ? (
						<NavLink
							to={`/users/${user.username}`}
							className={({ isActive }) => cx(styles.navLink, isActive && styles.activeLink)}
							onClick={() => setNavOpen(false)}
						>
							{m.nav_profile()}
						</NavLink>
					) : null}
				</nav>

				<div className={styles.footer}>
					{user ? (
						<div className={styles.account}>
							<span className={styles.accountAvatar} aria-hidden="true">
								{user.displayName.slice(0, 1).toUpperCase()}
							</span>
							<span className={styles.accountMeta}>
								<strong>{user.displayName}</strong>
								<small>@{user.username}</small>
							</span>
						</div>
					) : null}

					<LanguageSwitcher />

					<button
						aria-pressed={theme === "dark"}
						className={styles.themeToggle}
						onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
						type="button"
					>
						{m.common_theme()}{" "}
						<span>{theme === "dark" ? m.common_theme_dark() : m.common_theme_light()}</span>
					</button>

					{user ? (
						<Button variant="ghost" onClick={() => logout()} type="button">
							{m.common_logout()}
						</Button>
					) : null}
				</div>
			</aside>

			<main className={styles.main} id="main-content" tabIndex={-1}>
				<Routes>
					<Route index element={<DashboardPage />} />
					<Route path="quizzes" element={<QuizzesPage />} />
					<Route path="quizzes/:quizId/play" element={<QuizPage />} />
					<Route path="upload" element={<UploadPage />} />
					<Route path="groups" element={<GroupsPage />} />
					<Route path="groups/:groupId" element={<GroupPage />} />
					<Route path="users/:username" element={<ProfilePage />} />
					<Route path="*" element={<NotFoundPage />} />
				</Routes>
			</main>
		</div>
	);
}

function App() {
	const { user, loading } = useAuth();
	const location = useLocation();

	if (loading) {
		return (
			<div className={styles.bootScreen} role="status" aria-live="polite">
				<span className={styles.brandMark}>I</span>
				<p>{m.boot_loading()}</p>
			</div>
		);
	}

	if (!user) {
		if (location.pathname === "/login") return <LoginPage />;
		return <Navigate to="/login" replace />;
	}

	if (location.pathname === "/login") return <Navigate to="/" replace />;

	return <Shell />;
}

createRoot(document.getElementById("root") as HTMLElement).render(
	<StrictMode>
		<BrowserRouter basename="/app">
			<AuthProvider>
				<App />
			</AuthProvider>
		</BrowserRouter>
	</StrictMode>,
);
