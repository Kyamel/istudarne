import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
	Button,
	ButtonLink,
	Eyebrow,
	Loading,
	Muted,
	Page,
	Panel,
	SimpleList,
	StatusMessage,
	StatusTag,
} from "../components";
import type { ChatMessage, GroupDetail } from "../lib/api";
import { fetchGroup, groupChatUrl, leaveGroup } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { cx } from "../lib/classes";
import { m } from "../lib/i18n";
import styles from "./Group.module.css";

export function GroupPage() {
	const { groupId } = useParams();
	const { user } = useAuth();
	const [group, setGroup] = useState<GroupDetail | null>(null);
	const [error, setError] = useState("");
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [draft, setDraft] = useState("");
	const [connected, setConnected] = useState(false);
	const socketRef = useRef<WebSocket | null>(null);
	const logRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (!groupId) return;
		let active = true;
		fetchGroup(groupId)
			.then((data) => active && setGroup(data.group))
			.catch((err: Error) => active && setError(err.message));
		return () => {
			active = false;
		};
	}, [groupId]);

	useEffect(() => {
		if (!groupId || !group?.role) return;
		const socket = new WebSocket(groupChatUrl(groupId));
		socketRef.current = socket;

		socket.addEventListener("open", () => setConnected(true));
		socket.addEventListener("close", () => setConnected(false));
		socket.addEventListener("message", (event) => {
			try {
				const payload = JSON.parse(event.data as string) as {
					type: "history" | "message";
					messages?: ChatMessage[];
					message?: ChatMessage;
				};
				if (payload.type === "history" && payload.messages) {
					setMessages(payload.messages);
				} else if (payload.type === "message" && payload.message) {
					setMessages((current) => [...current, payload.message as ChatMessage]);
				}
			} catch {
				// ignora payloads malformados
			}
		});

		return () => socket.close();
	}, [groupId, group?.role]);

	const messageCount = messages.length;

	useEffect(() => {
		if (messageCount < 0) return;
		logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
	}, [messageCount]);

	function sendMessage(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const body = draft.trim();
		if (!body || socketRef.current?.readyState !== WebSocket.OPEN) return;
		socketRef.current.send(JSON.stringify({ body }));
		setDraft("");
	}

	async function handleLeave() {
		if (!groupId) return;
		await leaveGroup(groupId);
		window.location.assign("/app/groups");
	}

	if (error) {
		return (
			<Page>
				<StatusMessage tone="danger" role="alert">
					{error}
				</StatusMessage>
				<ButtonLink to="/groups">{m.common_back()}</ButtonLink>
			</Page>
		);
	}

	if (!group) {
		return (
			<Page>
				<Loading>{m.groups_loading()}</Loading>
			</Page>
		);
	}

	return (
		<Page>
			<header className={styles.header}>
				<div>
					<Eyebrow>{m.group_eyebrow()}</Eyebrow>
					<h1>{group.name}</h1>
					<p>{group.description || "—"}</p>
				</div>
				{group.role && group.role !== "owner" ? (
					<Button variant="ghost" onClick={handleLeave}>
						{m.group_leave()}
					</Button>
				) : null}
			</header>

			<div className={styles.layout}>
				<div className={styles.main}>
					<Panel>
						<h2>{m.group_shared_quizzes()}</h2>
						{group.quizzes.length === 0 ? (
							<Muted>{m.group_no_quizzes()}</Muted>
						) : (
							<SimpleList>
								{group.quizzes.map((quiz) => (
									<li key={quiz.id}>
										<a href={`/app/quizzes/${quiz.id}/play`}>{quiz.title}</a>
										<small>{m.quiz_card_questions({ count: quiz.questionCount })}</small>
									</li>
								))}
							</SimpleList>
						)}
					</Panel>

					{group.role ? (
						<Panel className={styles.chatPanel}>
							<div className={styles.chatHead}>
								<h2>{m.group_chat()}</h2>
								<StatusTag tone={connected ? "ok" : "pending"}>
									{connected ? m.group_online() : m.group_connecting()}
								</StatusTag>
							</div>

							<div className={styles.log} ref={logRef} aria-live="polite">
								{messages.length === 0 ? (
									<Muted>{m.group_no_messages()}</Muted>
								) : (
									messages.map((message) => (
										<div
											className={cx(styles.bubble, message.senderId === user?.id && styles.self)}
											key={message.id}
										>
											<span className={styles.author}>{message.displayName}</span>
											<p>{message.body}</p>
										</div>
									))
								)}
							</div>

							<form className={styles.form} onSubmit={sendMessage}>
								<label className={styles.srOnly} htmlFor="chat-input">
									{m.group_message()}
								</label>
								<input
									autoComplete="off"
									id="chat-input"
									maxLength={2000}
									onChange={(event) => setDraft(event.target.value)}
									placeholder={m.group_message_placeholder()}
									value={draft}
								/>
								<Button variant="primary" disabled={!connected} type="submit">
									{m.group_send()}
								</Button>
							</form>
						</Panel>
					) : null}
				</div>

				<aside>
					<Panel>
						<h2>{m.group_members_title()}</h2>
						<SimpleList>
							{group.members.map((member) => (
								<li key={member.userId}>
									<a href={`/app/users/${member.username}`}>{member.displayName}</a>
									<span className={styles.role}>{member.role}</span>
								</li>
							))}
						</SimpleList>
					</Panel>
				</aside>
			</div>
		</Page>
	);
}
