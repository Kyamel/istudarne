/** Auth module — stateless access tokens (HS256 JWT via hono/jwt). */
import { sign, verify } from "hono/jwt";

/** Short-lived so a leaked access token has a small blast radius. */
export const ACCESS_TOKEN_TTL_SECONDS = 60 * 15;

export async function signAccessToken(
	secret: string,
	userId: string,
	ttlSeconds: number = ACCESS_TOKEN_TTL_SECONDS,
): Promise<string> {
	const now = Math.floor(Date.now() / 1000);
	return sign({ sub: userId, iat: now, exp: now + ttlSeconds }, secret);
}

/** Returns the user id from a valid, unexpired access token, or null. */
export async function verifyAccessToken(secret: string, token: string): Promise<string | null> {
	try {
		const payload = await verify(token, secret, "HS256");
		return typeof payload.sub === "string" ? payload.sub : null;
	} catch {
		return null;
	}
}
