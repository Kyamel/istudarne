import type { Database } from "../../db/client";
import { sessions } from "../../db/schema";

export type CreateSessionInput = {
	id: string;
	userId: string;
	tokenHash: string;
	expiresAt: Date;
};

export async function createSession(db: Database, input: CreateSessionInput) {
	await db.insert(sessions).values(input);
}
