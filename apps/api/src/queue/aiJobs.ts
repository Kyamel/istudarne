import { createContainer } from "@api/server/container";
import { type AiJobMessage, aiJobResultKey } from "@api/server/services/aiService";
import { runPrompt } from "@api/server/services/openai";

/** Keep in sync with `max_retries` for the queue consumer in wrangler.jsonc. */
const MAX_ATTEMPTS = 3;

/**
 * Queue consumer for AI jobs. Runs outside the request/response cycle, so the
 * multi-second OpenAI latency never blocks a user request; the await time is
 * I/O and does not count against the Workers CPU budget.
 */
export async function handleAiJobsBatch(
	batch: MessageBatch<AiJobMessage>,
	env: CloudflareBindings,
) {
	const { aiJobs, storage } = createContainer(env);

	for (const message of batch.messages) {
		const { jobId } = message.body;
		try {
			const job = await aiJobs.get(jobId);
			if (!job || job.status === "succeeded") {
				message.ack();
				continue;
			}

			await aiJobs.markProcessing(jobId);
			const input = await storage.getJson<{ prompt: string }>(job.inputKey);
			if (!input) throw new Error(`Missing input payload for AI job ${jobId}.`);

			const text = await runPrompt(
				{ apiKey: env.OPENAI_API_KEY, model: env.OPENAI_MODEL },
				input.prompt,
			);

			const resultKey = aiJobResultKey(jobId);
			await storage.putJson(resultKey, { text });
			await aiJobs.markSucceeded(jobId, resultKey);
			message.ack();
		} catch (error) {
			const reason = error instanceof Error ? error.message : "AI job failed.";
			console.error(
				JSON.stringify({ event: "ai_job.error", jobId, attempt: message.attempts, reason }),
			);

			if (message.attempts >= MAX_ATTEMPTS) {
				await aiJobs.markFailed(jobId, reason);
				message.ack();
			} else {
				message.retry();
			}
		}
	}
}
