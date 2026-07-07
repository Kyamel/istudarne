import type { Database } from "../../db/client";
import { users } from "../../db/schema";

export type CreateUserInput = {
	email: string;
	passwordHash: string;
	username: string;
	displayName: string;
};

export async function createUser(db: Database, input: CreateUserInput) {
	const now = new Date();
	const id = crypto.randomUUID();
	await db.insert(users).values({
		id,
		email: input.email.toLowerCase(),
		passwordHash: input.passwordHash,
		username: input.username,
		displayName: input.displayName,
		createdAt: now,
		updatedAt: now,
	});
	return { id };
}
