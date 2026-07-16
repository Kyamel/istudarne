import { type AuthEmailSender, createConsoleEmailSender } from "@istudarne/auth";

/**
 * Resend-backed implementation of the auth module's email seam. Without an API
 * key (local dev) it falls back to the console sender, which logs the action
 * link so every flow stays completable offline.
 */
export function createAuthEmailSender(config: {
	apiKey: string | undefined;
	from: string;
}): AuthEmailSender {
	if (!config.apiKey) return createConsoleEmailSender();
	const { apiKey, from } = config;

	const send = async (to: string, subject: string, html: string): Promise<void> => {
		const response = await fetch("https://api.resend.com/emails", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ from, to, subject, html }),
		});
		if (!response.ok) {
			console.error(
				JSON.stringify({ event: "auth.email.send_failed", to, status: response.status }),
			);
		}
	};

	return {
		sendVerification: ({ to, url }) =>
			send(
				to,
				"Verify your email",
				`<p>Confirm your Istudarne email address:</p><p><a href="${url}">${url}</a></p>`,
			),
		sendPasswordReset: ({ to, url }) =>
			send(
				to,
				"Reset your password",
				`<p>Reset your Istudarne password:</p><p><a href="${url}">${url}</a></p>`,
			),
		sendNewDeviceAlert: ({ to, device, ipAddress }) =>
			send(
				to,
				"New sign-in to your account",
				`<p>A new sign-in to your Istudarne account from ${device}${
					ipAddress ? ` (${ipAddress})` : ""
				}. If this was not you, reset your password.</p>`,
			),
	};
}
