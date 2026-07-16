import { useEffect, useState } from "react";
import {
	ButtonLink,
	CheckList,
	ContentGrid,
	ListItem,
	MetricCard,
	MetricSkeleton,
	MetricsGrid,
	Muted,
	Page,
	PageHeader,
	Panel,
	SimpleList,
	StatusMessage,
	StatusTag,
} from "../components";
import type { HistoryEntry, UserStats } from "../lib/api";
import { fetchHistory, fetchStats } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { m } from "../lib/i18n";

function formatDate(timestamp: number) {
	return new Date(timestamp).toLocaleDateString(undefined, {
		day: "2-digit",
		month: "short",
	});
}

const metricSkeletons = ["questions", "accuracy", "streak", "points"];

export default function DashboardPage() {
	const { user } = useAuth();
	const [stats, setStats] = useState<UserStats | null>(null);
	const [history, setHistory] = useState<HistoryEntry[]>([]);
	const [error, setError] = useState("");

	useEffect(() => {
		Promise.all([fetchStats(), fetchHistory()])
			.then(([statsData, historyData]) => {
				setStats(statsData.stats);
				setHistory(historyData.history);
			})
			.catch((err: Error) => setError(err.message));
	}, []);

	const metrics = stats
		? [
				{ label: m.dashboard_metric_today(), value: stats.questionsToday },
				{ label: m.dashboard_metric_accuracy(), value: `${stats.accuracy}%` },
				{ label: m.dashboard_metric_streak(), value: stats.streak },
				{ label: m.dashboard_metric_points(), value: stats.points.toLocaleString() },
			]
		: [];

	return (
		<Page>
			<PageHeader
				eyebrow={m.dashboard_eyebrow()}
				title={m.dashboard_greeting({
					name: user?.displayName.split(" ")[0] ?? "",
				})}
				description={m.dashboard_subtitle()}
				actions={
					<ButtonLink to="/upload" variant="primary">
						{m.dashboard_send_json()}
					</ButtonLink>
				}
			/>

			{error ? (
				<StatusMessage tone="danger" role="alert">
					{error}
				</StatusMessage>
			) : null}

			<MetricsGrid>
				{stats
					? metrics.map((metric) => (
							<MetricCard key={metric.label} label={metric.label} value={metric.value} />
						))
					: metricSkeletons.map((slot) => <MetricSkeleton key={slot} />)}
			</MetricsGrid>

			<ContentGrid>
				<Panel title={m.dashboard_recent_history()}>
					{history.length === 0 ? (
						<Muted>{m.dashboard_no_history()}</Muted>
					) : (
						<SimpleList>
							{history.slice(0, 6).map((entry) => (
								<ListItem
									key={entry.attemptId}
									trailing={
										<StatusTag tone={entry.status === "finished" ? "ok" : "pending"}>
											{entry.status === "finished"
												? `${entry.correctCount}/${entry.correctCount + entry.wrongCount}`
												: "…"}
										</StatusTag>
									}
								>
									<a href={`/app/quizzes/${entry.quizId}/play`}>{entry.quizTitle}</a>
									<small>{formatDate(entry.startedAt)}</small>
								</ListItem>
							))}
						</SimpleList>
					)}
					<ButtonLink className="justify-self-start" to="/quizzes">
						{m.dashboard_view_library()}
					</ButtonLink>
				</Panel>

				<Panel title={m.dashboard_week_focus()}>
					<CheckList>
						<li>{m.dashboard_no_history()}</li>
					</CheckList>
					{stats ? (
						<Muted>
							{stats.quizzesOwned} · {stats.attempts}
						</Muted>
					) : null}
				</Panel>
			</ContentGrid>
		</Page>
	);
}
