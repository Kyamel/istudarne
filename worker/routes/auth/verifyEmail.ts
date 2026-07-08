import { createRoute, type RouteHandler, z } from "@hono/zod-openapi";
import {
	okResponseSchema,
	resendVerificationRequestSchema,
	verifyEmailRequestSchema,
} from "@shared/contracts";
import type { HonoEnv } from "@api/env";
import { container } from "@api/http/context";
import { errorResponse, jsonBody, jsonResponse } from "@api/openapi";

export function verificationUrl(origin: string, token: string) {
	return `${origin}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
}

/* Minimal standalone page for the link opened from the email client. */
function verificationPage(title: string, message: string) {
	return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title} — Istudarne</title></head>
<body style="font-family: system-ui, sans-serif; display: grid; place-items: center; min-height: 100vh; margin: 0; background: #17141f; color: #e8e4f0;">
<main style="text-align: center; padding: 2rem;">
<h1 style="color: #a78bfa;">${title}</h1>
<p>${message}</p>
<p><a href="/" style="color: #a78bfa;">Go to Istudarne</a></p>
</main>
</body>
</html>`;
}

const VerifyEmailQuerySchema = z.object({
	token: z
		.string()
		.min(1)
		.openapi({
			param: { name: "token", in: "query" },
			description: "Verification token from the email link.",
		}),
});

/* GET — the link users click in the verification email. Returns HTML. */
export const verifyEmailLinkRoute = createRoute({
	method: "get",
	path: "/api/auth/verify-email",
	tags: ["Auth"],
	summary: "Verify email (link from the email message)",
	request: {
		query: VerifyEmailQuerySchema,
	},
	responses: {
		200: {
			description: "Email verified; renders a confirmation page.",
			content: { "text/html": { schema: z.string() } },
		},
		400: {
			description: "Invalid or expired token; renders an error page.",
			content: { "text/html": { schema: z.string() } },
		},
	},
});

export const verifyEmailLinkHandler: RouteHandler<typeof verifyEmailLinkRoute, HonoEnv> = async (
	c,
) => {
	const { token } = c.req.valid("query");
	try {
		await container(c).services.auth.verifyEmail(token);
		return c.html(
			verificationPage("Email verified", "Your email address has been confirmed."),
			200,
		);
	} catch {
		return c.html(
			verificationPage(
				"Verification failed",
				"This verification link is invalid or has expired. Sign in and request a new one.",
			),
			400,
		);
	}
};

/* POST — JSON variant for the web/native apps. */
export const verifyEmailRoute = createRoute({
	method: "post",
	path: "/api/auth/verify-email",
	tags: ["Auth"],
	summary: "Verify email (JSON)",
	request: {
		body: jsonBody(verifyEmailRequestSchema),
	},
	responses: {
		200: jsonResponse(okResponseSchema, "Email verified."),
		400: errorResponse("Invalid or expired verification token."),
	},
});

export const verifyEmailHandler: RouteHandler<typeof verifyEmailRoute, HonoEnv> = async (c) => {
	const { token } = c.req.valid("json");
	await container(c).services.auth.verifyEmail(token);
	return c.json({ ok: true as const }, 200);
};

/* POST — resend the verification email. Unauthenticated (an unverified account
   cannot sign in to ask) and always answers ok, so it cannot be used to probe
   which emails have accounts. */
export const resendVerificationRoute = createRoute({
	method: "post",
	path: "/api/auth/resend-verification",
	tags: ["Auth"],
	summary: "Resend the verification email",
	description:
		"Always responds ok. The email is only actually sent when the address belongs to an " +
		"account that has not verified yet.",
	request: {
		body: jsonBody(resendVerificationRequestSchema),
	},
	responses: {
		200: jsonResponse(okResponseSchema, "Verification email queued (when applicable)."),
		400: errorResponse("Invalid payload."),
	},
});

export const resendVerificationHandler: RouteHandler<
	typeof resendVerificationRoute,
	HonoEnv
> = async (c) => {
	const { email } = c.req.valid("json");
	const { services } = container(c);

	const pending = await services.auth.requestEmailVerification(email);
	if (pending) {
		const url = verificationUrl(new URL(c.req.url).origin, pending.token);
		c.executionCtx.waitUntil(services.email.sendVerificationEmail(pending.user.email, url));
	}

	return c.json({ ok: true as const }, 200);
};
