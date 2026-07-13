import { desc, eq } from "drizzle-orm";
import type { Database } from "../../db/client";
import { passwordResetTokens, refreshTokens, users } from "../../db/schema";

export type CreatePasswordResetTokenInput = {
	id: string;
	userId: string;
	tokenHash: string;
	expiresAt: Date;
};

export async function insertPasswordResetToken(db: Database, input: CreatePasswordResetTokenInput) {
	await db.insert(passwordResetTokens).values(input);
}

export async function getPasswordResetTokenByHash(db: Database, tokenHash: string) {
	const [row] = await db
		.select()
		.from(passwordResetTokens)
		.where(eq(passwordResetTokens.tokenHash, tokenHash))
		.limit(1);
	return row ?? null;
}

/** Creation time of the user's most recent reset token (resend cooldown). */
export async function getLatestPasswordResetTokenTime(
	db: Database,
	userId: string,
): Promise<Date | null> {
	const [row] = await db
		.select({ createdAt: passwordResetTokens.createdAt })
		.from(passwordResetTokens)
		.where(eq(passwordResetTokens.userId, userId))
		.orderBy(desc(passwordResetTokens.createdAt))
		.limit(1);
	return row?.createdAt ?? null;
}

/**
 * Consumes the token, sets the new password, and revokes every refresh token —
 * as one D1 batch so a partial reset can never leave the account half-changed.
 */
export async function completePasswordReset(
	db: Database,
	input: { tokenId: string; userId: string; passwordHash: string },
) {
	const now = new Date();
	await db.batch([
		db
			.update(passwordResetTokens)
			.set({ usedAt: now })
			.where(eq(passwordResetTokens.id, input.tokenId)),
		db
			.update(users)
			.set({ passwordHash: input.passwordHash, updatedAt: now })
			.where(eq(users.id, input.userId)),
		db.update(refreshTokens).set({ revokedAt: now }).where(eq(refreshTokens.userId, input.userId)),
	]);
}
