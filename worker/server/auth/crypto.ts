const encoder = new TextEncoder();
const PBKDF2_ITERATIONS = 100_000;

function toBase64(bytes: Uint8Array) {
	let binary = "";
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary);
}

function fromBase64(value: string) {
	const binary = atob(value);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
	return bytes;
}

async function derive(password: string, salt: Uint8Array, iterations: number) {
	const key = await crypto.subtle.importKey(
		"raw",
		encoder.encode(password) as BufferSource,
		"PBKDF2",
		false,
		["deriveBits"],
	);
	const bits = await crypto.subtle.deriveBits(
		{ name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" },
		key,
		256,
	);
	return new Uint8Array(bits);
}

export async function hashPassword(password: string) {
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const hash = await derive(password, salt, PBKDF2_ITERATIONS);
	return `pbkdf2$${PBKDF2_ITERATIONS}$${toBase64(salt)}$${toBase64(hash)}`;
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array) {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
	return diff === 0;
}

export async function verifyPassword(password: string, stored: string) {
	const [scheme, iterationsRaw, saltRaw, hashRaw] = stored.split("$");
	if (scheme !== "pbkdf2" || !iterationsRaw || !saltRaw || !hashRaw) return false;
	const actual = await derive(password, fromBase64(saltRaw), Number(iterationsRaw));
	return constantTimeEqual(actual, fromBase64(hashRaw));
}

export async function sha256Hex(value: string) {
	const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
	return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** URL-safe random opaque token (refresh tokens, email verification, etc.). */
export function generateToken() {
	return toBase64(crypto.getRandomValues(new Uint8Array(32)))
		.replace(/[+/=]/g, "")
		.slice(0, 43);
}
