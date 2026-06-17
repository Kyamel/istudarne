import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
	Avatar,
	Button,
	Eyebrow,
	Loading,
	MetricCard,
	MetricsGrid,
	Muted,
	Page,
	Panel,
	SimpleList,
	StatusMessage,
} from "../components";
import type { Profile } from "../lib/api";
import { fetchProfile, setFollow } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { m } from "../lib/i18n";
import styles from "./Profile.module.css";

export function ProfilePage() {
	const { username } = useParams();
	const { user } = useAuth();
	const [profile, setProfile] = useState<Profile | null>(null);
	const [error, setError] = useState("");
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		if (!username) return;
		let active = true;
		setProfile(null);
		setError("");
		fetchProfile(username)
			.then((data) => active && setProfile(data.profile))
			.catch((err: Error) => active && setError(err.message));
		return () => {
			active = false;
		};
	}, [username]);

	async function toggleFollow() {
		if (!profile) return;
		setBusy(true);
		try {
			await setFollow(profile.username, !profile.isFollowing);
			setProfile({
				...profile,
				isFollowing: !profile.isFollowing,
				followers: profile.followers + (profile.isFollowing ? -1 : 1),
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : m.auth_generic_error());
		} finally {
			setBusy(false);
		}
	}

	if (error) {
		return (
			<Page>
				<StatusMessage tone="danger" role="alert">
					{error}
				</StatusMessage>
			</Page>
		);
	}

	if (!profile) {
		return (
			<Page>
				<Loading>{m.profile_loading()}</Loading>
			</Page>
		);
	}

	const isSelf = user?.id === profile.id;

	return (
		<Page>
			<header className={styles.header}>
				<Avatar name={profile.displayName} />
				<div className={styles.meta}>
					<Eyebrow>{m.profile_eyebrow()}</Eyebrow>
					<h1>{profile.displayName}</h1>
					<Muted>@{profile.username}</Muted>
					{profile.bio ? <p>{profile.bio}</p> : null}
				</div>
				{isSelf ? null : (
					<Button
						aria-pressed={profile.isFollowing}
						variant={profile.isFollowing ? "default" : "primary"}
						disabled={busy}
						onClick={toggleFollow}
					>
						{profile.isFollowing ? m.profile_following() : m.profile_follow()}
					</Button>
				)}
			</header>

			<MetricsGrid>
				<MetricCard label={m.profile_metric_questions()} value={profile.stats.questionsTotal} />
				<MetricCard label={m.profile_metric_accuracy()} value={`${profile.stats.accuracy}%`} />
				<MetricCard label={m.profile_metric_followers()} value={profile.followers} />
				<MetricCard label={m.profile_metric_following()} value={profile.following} />
			</MetricsGrid>

			<Panel>
				<h2>{m.profile_published()}</h2>
				{profile.quizzes.length === 0 ? (
					<Muted>{m.profile_no_quizzes()}</Muted>
				) : (
					<SimpleList>
						{profile.quizzes.map((quiz) => (
							<li key={quiz.id}>
								<a href={`/app/quizzes/${quiz.id}/play`}>{quiz.title}</a>
								<small>{m.quiz_card_questions({ count: quiz.questionCount })}</small>
							</li>
						))}
					</SimpleList>
				)}
			</Panel>
		</Page>
	);
}
