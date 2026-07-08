/**
 * Auth module — transactional email via the Resend REST API
 * (https://resend.com). When `apiKey` is not configured (local dev), the
 * verification link is logged instead of sent so the flow stays testable end
 * to end.
 */

type EmailConfig = {
	apiKey: string | undefined;
	from: string;
};

export function createEmailService(config: EmailConfig) {
	async function send(to: string, subject: string, html: string): Promise<void> {
		if (!config.apiKey) {
			console.log(JSON.stringify({ event: "email.skipped", to, subject }));
			return;
		}

		const response = await fetch("https://api.resend.com/emails", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${config.apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ from: config.from, to: [to], subject, html }),
		});

		if (!response.ok) {
			const detail = await response.text();
			console.error(JSON.stringify({ event: "email.failed", to, subject, detail }));
			throw new Error(`Resend request failed with status ${response.status}`);
		}
	}

	return {
		sendVerificationEmail(to: string, verificationUrl: string): Promise<void> {
			if (!config.apiKey) {
				// Dev convenience: the link is required to complete the flow locally.
				console.log(JSON.stringify({ event: "email.verification_link", to, verificationUrl }));
				return Promise.resolve();
			}
			return send(
				to,
				"Confirm your email",
				`<p>Welcome!</p>
				 <p>Confirm your email address by clicking the link below:</p>
				 <p><a href="${verificationUrl}">Verify my email</a></p>
				 <p>The link expires in 48 hours. If you did not create this account, ignore this message.</p>`,
			);
		},
	};
}

export type EmailService = ReturnType<typeof createEmailService>;
