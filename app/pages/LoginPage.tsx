import type { FormEvent } from "react";
import { useState } from "react";
import { Button, Field, LanguageSwitcher, StatusMessage } from "../components";
import { ApiError } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { m } from "../lib/i18n";
import styles from "./LoginPage.module.css";

type Mode = "login" | "register";

export default function LoginPage() {
	const { login, register } = useAuth();
	const [mode, setMode] = useState<Mode>("login");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [username, setUsername] = useState("");
	const [displayName, setDisplayName] = useState("");
	const [error, setError] = useState("");
	const [busy, setBusy] = useState(false);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError("");
		setBusy(true);
		try {
			if (mode === "login") await login(email, password);
			else await register({ email, username, displayName, password });
		} catch (err) {
			setError(
				err instanceof ApiError || err instanceof Error ? err.message : m.auth_generic_error(),
			);
		} finally {
			setBusy(false);
		}
	}

	return (
		<div className={styles.screen}>
			<section className={styles.card} aria-labelledby="auth-title">
				<div className={styles.top}>
					<div className={styles.brand}>
						<span className={styles.brandMark}>I</span>
						<div>
							<strong>Istudarne</strong>
							<small>{m.app_tagline()}</small>
						</div>
					</div>
					<LanguageSwitcher />
				</div>

				<div className={styles.tabs} role="tablist" aria-label="Istudarne">
					<button
						aria-selected={mode === "login"}
						className={styles.tab}
						onClick={() => setMode("login")}
						role="tab"
						type="button"
					>
						{m.auth_tab_login()}
					</button>
					<button
						aria-selected={mode === "register"}
						className={styles.tab}
						onClick={() => setMode("register")}
						role="tab"
						type="button"
					>
						{m.auth_tab_register()}
					</button>
				</div>

				<h1 className={styles.title} id="auth-title">
					{mode === "login" ? m.auth_login_title() : m.auth_register_title()}
				</h1>

				<form className={styles.form} onSubmit={handleSubmit}>
					{mode === "register" ? (
						<>
							<Field
								label={m.auth_display_name()}
								autoComplete="name"
								minLength={2}
								required
								value={displayName}
								onChange={(event) => setDisplayName(event.target.value)}
							/>
							<Field
								label={m.auth_username()}
								autoComplete="username"
								minLength={3}
								pattern="[A-Za-z0-9_]+"
								required
								value={username}
								onChange={(event) => setUsername(event.target.value)}
							/>
						</>
					) : null}

					<Field
						label={m.auth_email()}
						autoComplete="email"
						required
						type="email"
						value={email}
						onChange={(event) => setEmail(event.target.value)}
					/>
					<Field
						label={m.auth_password()}
						autoComplete={mode === "login" ? "current-password" : "new-password"}
						minLength={8}
						required
						type="password"
						value={password}
						onChange={(event) => setPassword(event.target.value)}
					/>

					{error ? (
						<StatusMessage tone="danger" role="alert">
							{error}
						</StatusMessage>
					) : null}

					<Button variant="primary" disabled={busy} type="submit">
						{busy
							? m.auth_busy()
							: mode === "login"
								? m.auth_submit_login()
								: m.auth_submit_register()}
					</Button>
				</form>

				<p className={styles.hint}>
					{mode === "login" ? m.auth_hint_login() : m.auth_hint_register()}
				</p>
			</section>
		</div>
	);
}
