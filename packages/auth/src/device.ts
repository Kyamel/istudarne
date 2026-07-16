/**
 * Auth module — user-agent parsing for the "new device" sign-in alert.
 *
 * Ported from visao-game's `login-device.ts`. Better Auth already records
 * `userAgent` and `ipAddress` on every session row, so we derive a readable
 * label from the string rather than tracking a separate device table.
 */

function pickBrowser(userAgent: string): string {
	const ua = userAgent.toLowerCase();
	if (ua.includes("edg/")) return "Edge";
	if (ua.includes("opr/") || ua.includes("opera")) return "Opera";
	if (ua.includes("chrome/") && !ua.includes("edg/")) return "Chrome";
	if (ua.includes("firefox/")) return "Firefox";
	if (ua.includes("safari/") && !ua.includes("chrome/") && !ua.includes("chromium/"))
		return "Safari";
	return "unknown browser";
}

function pickOs(userAgent: string): string {
	const ua = userAgent.toLowerCase();
	if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ios")) return "iOS";
	if (ua.includes("android")) return "Android";
	if (ua.includes("windows")) return "Windows";
	if (ua.includes("mac os") || ua.includes("macintosh")) return "macOS";
	if (ua.includes("linux")) return "Linux";
	return "unknown OS";
}

/** e.g. "Chrome on macOS". */
export function describeDevice(userAgent: string | null | undefined): string {
	if (!userAgent || !userAgent.trim()) return "an unknown device";
	return `${pickBrowser(userAgent)} on ${pickOs(userAgent)}`;
}

function normalizeUserAgent(userAgent: string | null | undefined): string {
	return userAgent?.trim().toLowerCase().replace(/\s+/g, " ") ?? "";
}

/**
 * Whether two sessions look like the same device. A missing user-agent never
 * matches, so a session with no UA is always treated as a new device.
 */
export function sameDevice(a: string | null | undefined, b: string | null | undefined): boolean {
	const left = normalizeUserAgent(a);
	const right = normalizeUserAgent(b);
	return left !== "" && left === right;
}
