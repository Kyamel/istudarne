/**
 * Auth module — email delivery seam.
 *
 * Better Auth owns the flows (verification, reset) and hands us a ready-made
 * link; delivering it is the host's job. The service only deals in an
 * `AuthEmailSender`, so a project swaps Resend/Cloudflare/etc. without touching
 * `create-auth.ts`. `createConsoleEmailSender` logs the link instead of sending
 * it, which keeps every flow testable end to end in local dev.
 */

export type AuthLinkEmail = {
	to: string;
	/** The action link Better Auth generated (verification / reset). */
	url: string;
	/** The raw token embedded in the link, exposed for custom delivery. */
	token: string;
};

export type AuthNewDeviceEmail = {
	to: string;
	/** Human-readable device label, e.g. "Chrome on macOS". */
	device: string;
	ipAddress?: string | null;
};

export interface AuthEmailSender {
	sendVerification(email: AuthLinkEmail): Promise<void>;
	sendPasswordReset(email: AuthLinkEmail): Promise<void>;
	sendNewDeviceAlert(email: AuthNewDeviceEmail): Promise<void>;
}

/** Dev-only sender: the link is logged so the flow can be completed locally. */
export function createConsoleEmailSender(): AuthEmailSender {
	const log = (event: string, data: Record<string, unknown>) =>
		console.log(JSON.stringify({ event, ...data }));

	return {
		sendVerification({ to, url }) {
			log("auth.email.verification_link", { to, url });
			return Promise.resolve();
		},
		sendPasswordReset({ to, url }) {
			log("auth.email.password_reset_link", { to, url });
			return Promise.resolve();
		},
		sendNewDeviceAlert({ to, device, ipAddress }) {
			log("auth.email.new_device_alert", { to, device, ipAddress });
			return Promise.resolve();
		},
	};
}
