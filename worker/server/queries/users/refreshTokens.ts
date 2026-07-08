import { eq } from "drizzle-orm";
import type { Database } from "../../db/client";
import { refreshTokens } from "../../db/schema";

export type CreateRefreshTokenInput = {
	id: string;
	userId: string;
	tokenHash: string;
	expiresAt: Date;
};

export async function insertRefreshToken(db: Database, input: CreateRefreshTokenInput) {
	await db.insert(refreshTokens).values(input);
}

export async function getRefreshTokenByHash(db: Database, tokenHash: string) {
	const [row] = await db
		.select()
		.from(refreshTokens)
		.where(eq(refreshTokens.tokenHash, tokenHash))
		.limit(1);
	return row ?? null;
}

export async function revokeRefreshToken(db: Database, id: string, replacedById: string | null) {
	await db
		.update(refreshTokens)
		.set({ revokedAt: new Date(), replacedById })
		.where(eq(refreshTokens.id, id));
}

/** Kills every session of a user — used when refresh-token reuse is detected. */
export async function revokeAllUserRefreshTokens(db: Database, userId: string) {
	await db
		.update(refreshTokens)
		.set({ revokedAt: new Date() })
		.where(eq(refreshTokens.userId, userId));
}
