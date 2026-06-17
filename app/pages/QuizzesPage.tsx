import { useEffect, useState } from "react";
import { ButtonLink, Muted, Page, PageHeader, QuizCard, Tabs } from "../components";
import type { QuizSummary } from "../lib/api";
import { fetchMyQuizzes, searchQuizzes } from "../lib/api";
import { m } from "../lib/i18n";
import styles from "./QuizzesPage.module.css";

type Tab = "public" | "mine";

export default function QuizzesPage() {
	const [tab, setTab] = useState<Tab>("public");
	const [query, setQuery] = useState("");
	const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
	const [status, setStatus] = useState<string>(m.quizzes_loading());

	useEffect(() => {
		let active = true;
		setStatus(m.quizzes_loading());

		if (tab === "mine") {
			fetchMyQuizzes()
				.then((data) => {
					if (!active) return;
					setQuizzes(data.quizzes);
					setStatus(data.quizzes.length ? "" : m.quizzes_empty_mine());
				})
				.catch((error: Error) => active && setStatus(error.message));
			return () => {
				active = false;
			};
		}

		const timeout = window.setTimeout(() => {
			searchQuizzes(query)
				.then((data) => {
					if (!active) return;
					setQuizzes(data.quizzes);
					setStatus(data.quizzes.length ? "" : m.quizzes_empty_public());
				})
				.catch((error: Error) => active && setStatus(error.message));
		}, 180);

		return () => {
			active = false;
			window.clearTimeout(timeout);
		};
	}, [query, tab]);

	return (
		<Page>
			<PageHeader
				eyebrow={m.quizzes_eyebrow()}
				title={m.quizzes_title()}
				description={m.quizzes_subtitle()}
				actions={
					<ButtonLink to="/upload" variant="primary">
						{m.quizzes_new()}
					</ButtonLink>
				}
			/>

			<Tabs<Tab>
				label={m.quizzes_title()}
				value={tab}
				onChange={setTab}
				options={[
					{ value: "public", label: m.quizzes_tab_public() },
					{ value: "mine", label: m.quizzes_tab_mine() },
				]}
			/>

			{tab === "public" ? (
				<label className={styles.search}>
					<span>{m.quizzes_search_label()}</span>
					<input
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder={m.quizzes_search_placeholder()}
						type="search"
					/>
				</label>
			) : null}

			{status ? <Muted>{status}</Muted> : null}

			<div className={styles.grid}>
				{quizzes.map((quiz) => (
					<QuizCard key={quiz.id} quiz={quiz} />
				))}
			</div>
		</Page>
	);
}
