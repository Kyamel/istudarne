import { type ChatEvent, chatInboundMessageSchema } from "@shared/contracts";
import { createContainer } from "./container";
import type { GroupRepository } from "./repositories/groupRepository";

type ChatSession = {
	socket: WebSocket;
	userId: string;
	displayName: string;
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
		const displayName = url.searchParams.get("name") ?? "Anonymous";

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
				// Keep broadcasting even if persistence fails.
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
			const parsed = chatInboundMessageSchema.safeParse(JSON.parse(data));
			return parsed.success ? parsed.data.body : null;
		} catch {
			const parsed = chatInboundMessageSchema.safeParse({ body: data });
			return parsed.success ? parsed.data.body : null;
		}
	}

	private send(socket: WebSocket, payload: ChatEvent) {
		if (socket.readyState === WebSocket.OPEN) {
			socket.send(JSON.stringify(payload));
		}
	}

	private broadcast(payload: ChatEvent) {
		for (const session of this.sessions) {
			this.send(session.socket, payload);
		}
	}
}
