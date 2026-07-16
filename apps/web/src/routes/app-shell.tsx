import { useEffect, useState } from "react";
import { Navigate, Outlet, useNavigate } from "react-router";
import { useAuth } from "~/auth/context";
import {
	AccountBadge,
	Backdrop,
	BootScreen,
	Brand,
	Button,
	type Command,
	CommandPalette,
	IconButton,
	LanguageSwitcher,
	NavItem,
	SkipLink,
	ThemeToggle,
} from "~/components";
import { m } from "~/lib/i18n";

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
	const navigate = useNavigate();
	const [navOpen, setNavOpen] = useState(false);
	const [paletteOpen, setPaletteOpen] = useState(false);

	useEffect(() => {
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") setNavOpen(false);
			if ((event.ctrlKey || event.metaKey) && (event.key === "k" || event.key === "p")) {
				event.preventDefault();
				setPaletteOpen((open) => !open);
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);

	const closeNav = () => setNavOpen(false);

	const navItems = [
		{ to: "/app", label: m.nav_dashboard(), end: true },
		{ to: "/app/quizzes", label: m.nav_quizzes(), end: false },
		{ to: "/app/upload", label: m.nav_upload(), end: false },
		{ to: "/app/groups", label: m.nav_groups(), end: false },
	];

	const commands: Command[] = [
		...navItems.map((item) => ({
			id: `go${item.to}`,
			label: m.palette_go({ target: item.label }),
			keywords: item.to,
			run: () => navigate(item.to),
		})),
		...(user
			? [
					{
						id: "go/profile",
						label: m.palette_go({ target: m.nav_profile() }),
						keywords: user.username,
						run: () => navigate(`/app/users/${user.username}`),
					},
				]
			: []),
		{
			id: "theme",
			label: m.palette_theme_toggle(),
			hint: theme === "dark" ? m.common_theme_light() : m.common_theme_dark(),
			run: () => setTheme(theme === "dark" ? "light" : "dark"),
		},
		...(user ? [{ id: "logout", label: m.common_logout(), run: () => void logout() }] : []),
	];

	return (
		<div
			className="group min-h-screen desktop:grid desktop:grid-cols-[280px_minmax(0,1fr)]"
			data-nav-open={navOpen}
		>
			<SkipLink href="#main-content">{m.common_skip_to_content()}</SkipLink>

			<CommandPalette
				open={paletteOpen}
				onClose={() => setPaletteOpen(false)}
				commands={commands}
				placeholder={m.palette_placeholder()}
				emptyLabel={m.palette_empty()}
			/>

			<header className="sticky top-0 z-30 flex items-center gap-3 border-b border-edge bg-surface-tint px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 desktop:hidden">
				<IconButton
					aria-controls="primary-navigation"
					aria-expanded={navOpen}
					aria-label={m.nav_open_menu()}
					onClick={() => setNavOpen((open) => !open)}
				>
					<span aria-hidden="true">☰</span>
				</IconButton>
				<Brand to="/app" />
			</header>

			{navOpen ? <Backdrop label={m.nav_close_menu()} onClick={closeNav} /> : null}

			<aside
				className="fixed inset-y-0 left-0 z-40 flex w-[min(86vw,280px)] translate-x-[-105%] flex-col gap-5 overflow-y-auto border-r border-edge bg-surface-tint p-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1rem+env(safe-area-inset-bottom))] transition-transform duration-200 group-data-[nav-open=true]:translate-x-0 desktop:sticky desktop:top-0 desktop:h-screen desktop:w-auto desktop:translate-x-0 desktop:transition-none"
				id="primary-navigation"
				aria-label={m.nav_sections()}
			>
				<Brand to="/app" tagline={m.app_tagline()} />

				<nav className="grid gap-1.5" aria-label={m.nav_sections()}>
					{navItems.map((item) => (
						<NavItem key={item.to} to={item.to} end={item.end} onNavigate={closeNav}>
							{item.label}
						</NavItem>
					))}
					{user ? (
						<NavItem to={`/app/users/${user.username}`} onNavigate={closeNav}>
							{m.nav_profile()}
						</NavItem>
					) : null}
				</nav>

				<footer className="mt-auto grid gap-2.5 border-t border-edge pt-3.5">
					{user ? <AccountBadge displayName={user.displayName} username={user.username} /> : null}

					<button
						className="flex min-h-10 cursor-pointer items-center justify-between rounded-field border border-edge bg-surface px-3 font-medium text-fg-muted hover:text-fg"
						onClick={() => setPaletteOpen(true)}
						type="button"
					>
						{m.palette_open()}
						<kbd className="rounded-sm border border-edge bg-surface-muted px-1.5 py-0.5 text-[0.72rem]">
							Ctrl K
						</kbd>
					</button>

					<LanguageSwitcher />

					<ThemeToggle
						label={m.common_theme()}
						valueLabel={theme === "dark" ? m.common_theme_dark() : m.common_theme_light()}
						dark={theme === "dark"}
						onToggle={() => setTheme(theme === "dark" ? "light" : "dark")}
					/>

					{user ? (
						<Button variant="ghost" onClick={() => logout()} type="button">
							{m.common_logout()}
						</Button>
					) : null}
				</footer>
			</aside>

			<main
				className="px-4 pt-4 pb-[calc(3rem+env(safe-area-inset-bottom))] outline-none desktop:px-8 desktop:py-6"
				id="main-content"
				tabIndex={-1}
			>
				<Outlet />
			</main>
		</div>
	);
}

export default function AppShell() {
	const { user, loading } = useAuth();

	if (loading) {
		return <BootScreen>{m.boot_loading()}</BootScreen>;
	}

	if (!user) {
		return <Navigate to="/login" replace />;
	}

	return <Shell />;
}
