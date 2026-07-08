import { eq } from "drizzle-orm";
import type { Database } from "../../db/client";
import { emailVerificationTokens, users } from "../../db/schema";

export type CreateEmailVerificationTokenInput = {
	id: string;
	userId: string;
	tokenHash: string;
	expiresAt: Date;
};

export async function insertEmailVerificationToken(
	db: Database,
	input: CreateEmailVerificationTokenInput,
) {
	await db.insert(emailVerificationTokens).values(input);
}

export async function getEmailVerificationTokenByHash(db: Database, tokenHash: string) {
	const [row] = await db
		.select()
		.from(emailVerificationTokens)
		.where(eq(emailVerificationTokens.tokenHash, tokenHash))
		.limit(1);
	return row ?? null;
}

export async function markEmailVerificationTokenUsed(db: Database, id: string) {
	await db
		.update(emailVerificationTokens)
		.set({ usedAt: new Date() })
		.where(eq(emailVerificationTokens.id, id));
}

export async function markUserEmailVerified(db: Database, userId: string) {
	await db
		.update(users)
		.set({ emailVerifiedAt: new Date(), updatedAt: new Date() })
		.where(eq(users.id, userId));
}
