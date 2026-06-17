import { createContainer } from "./container";
import type { GroupRepository } from "./repositories/groupRepository";

type ChatSession = {
	socket: WebSocket;
	userId: string;
	displayName: string;
};

type OutgoingMessage = {
	type: "history" | "message";
	messages?: unknown[];
	message?: unknown;
};

export class StudyGroupChat implements DurableObject {
	private sessions = new Set<ChatSession>();
	private readonly groups: GroupRepository;

	constructor(_state: DurableObjectState, env: Env) {
		this.groups = createContainer(env).repositories.groups;
	}

	async fetch(request: Request) {
		if (request.headers.get("Upgrade") !== "websocket") {
			return new Response("Expected WebSocket", { status: 426 });
		}

		const url = new URL(request.url);
		const segments = url.pathname.split("/");
		const groupId = segments[segments.indexOf("groups") + 1] ?? "";
		const userId = url.searchParams.get("uid") ?? "anon";
		const displayName = url.searchParams.get("name") ?? "Anônimo";

		const [client, server] = Object.values(new WebSocketPair());
		const session: ChatSession = { socket: server, userId, displayName };
		this.sessions.add(session);
		server.accept();

		const history = await this.groups.messages(groupId);
		this.send(server, { type: "history", messages: history });

		server.addEventListener("message", async (event) => {
			const body = this.parseBody(event.data);
			if (!body) return;

			const message = {
				id: crypto.randomUUID(),
				groupId,
				senderId: userId,
				displayName,
				body,
				createdAt: Date.now(),
			};

			try {
				await this.groups.addMessage({ id: message.id, groupId, senderId: userId, body });
			} catch {
				// Mantém o broadcast mesmo se a persistência falhar.
			}

			this.broadcast({ type: "message", message });
		});

		const cleanup = () => this.sessions.delete(session);
		server.addEventListener("close", cleanup);
		server.addEventListener("error", cleanup);

		return new Response(null, { status: 101, webSocket: client });
	}

	private parseBody(data: unknown): string | null {
		if (typeof data !== "string") return null;
		try {
			const parsed = JSON.parse(data) as { body?: unknown };
			const body = typeof parsed.body === "string" ? parsed.body.trim() : "";
			return body ? body.slice(0, 2000) : null;
		} catch {
			const text = data.trim();
			return text ? text.slice(0, 2000) : null;
		}
	}

	private send(socket: WebSocket, payload: OutgoingMessage) {
		if (socket.readyState === WebSocket.OPEN) {
			socket.send(JSON.stringify(payload));
		}
	}

	private broadcast(payload: OutgoingMessage) {
		for (const session of this.sessions) {
			this.send(session.socket, payload);
		}
	}
}
