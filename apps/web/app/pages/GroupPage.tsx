import { chatEventSchema } from "@istudarne/contracts";
import type { SubmitEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import {
	Button,
	ButtonLink,
	ChatBubble,
	ChatComposer,
	ChatLog,
	ListItem,
	Loading,
	Muted,
	Page,
	PageHeader,
	Panel,
	Pill,
	Row,
	SimpleList,
	Stack,
	StatusMessage,
	StatusTag,
} from "../components";
import type { ChatMessage, GroupDetail } from "../lib/api";
import { fetchGroup, groupChatUrl, leaveGroup } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { m } from "../lib/i18n";

export default function GroupPage() {
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
				const payload = chatEventSchema.parse(JSON.parse(event.data as string));
				if (payload.type === "history") {
					setMessages(payload.messages);
				} else {
					setMessages((current) => [...current, payload.message]);
				}
			} catch {
				// Ignore malformed payloads.
			}
		});

		return () => socket.close();
	}, [groupId, group?.role]);

	const messageCount = messages.length;

	useEffect(() => {
		if (messageCount < 0) return;
		logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
	}, [messageCount]);

	function sendMessage(event: SubmitEvent<HTMLFormElement>) {
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
			<PageHeader
				eyebrow={m.group_eyebrow()}
				title={group.name}
				description={group.description || "—"}
				actions={
					group.role && group.role !== "owner" ? (
						<Button variant="ghost" onClick={handleLeave}>
							{m.group_leave()}
						</Button>
					) : null
				}
			/>

			<div className="grid items-start gap-4.5 desktop:grid-cols-[minmax(0,1fr)_280px]">
				<Stack gap="lg">
					<Panel title={m.group_shared_quizzes()}>
						{group.quizzes.length === 0 ? (
							<Muted>{m.group_no_quizzes()}</Muted>
						) : (
							<SimpleList>
								{group.quizzes.map((quiz) => (
									<ListItem
										key={quiz.id}
										trailing={<small>{m.quiz_card_questions({ count: quiz.questionCount })}</small>}
									>
										<a href={`/app/quizzes/${quiz.id}/play`}>{quiz.title}</a>
									</ListItem>
								))}
							</SimpleList>
						)}
					</Panel>

					{group.role ? (
						<Panel>
							<Row justify="between" gap="sm">
								<h2 className="text-xl">{m.group_chat()}</h2>
								<StatusTag tone={connected ? "ok" : "pending"}>
									{connected ? m.group_online() : m.group_connecting()}
								</StatusTag>
							</Row>

							<ChatLog ref={logRef}>
								{messages.length === 0 ? (
									<Muted>{m.group_no_messages()}</Muted>
								) : (
									messages.map((message) => (
										<ChatBubble
											key={message.id}
											author={message.displayName}
											body={message.body}
											self={message.senderId === user?.id}
										/>
									))
								)}
							</ChatLog>

							<ChatComposer
								value={draft}
								onChange={setDraft}
								onSubmit={sendMessage}
								label={m.group_message()}
								placeholder={m.group_message_placeholder()}
								sendLabel={m.group_send()}
								disabled={!connected}
							/>
						</Panel>
					) : null}
				</Stack>

				<aside>
					<Panel title={m.group_members_title()}>
						<SimpleList>
							{group.members.map((member) => (
								<ListItem
									key={member.userId}
									trailing={<Pill className="capitalize">{member.role}</Pill>}
								>
									<a href={`/app/users/${member.username}`}>{member.displayName}</a>
								</ListItem>
							))}
						</SimpleList>
					</Panel>
				</aside>
			</div>
		</Page>
	);
}
