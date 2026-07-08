/**
 * Thin client for the OpenAI Chat Completions REST API. Only ever called from
 * the queue consumer: the multi-second upstream latency is spent awaiting I/O
 * (which does not count against the Workers CPU-time budget), but it would
 * still block the user's request, so NLP features run as async jobs.
 */

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = "gpt-4o-mini";

type OpenAiConfig = { apiKey: string | undefined; model?: string };

type ChatCompletionResponse = {
	choices?: { message?: { content?: string | null } }[];
};

export async function runPrompt(config: OpenAiConfig, prompt: string): Promise<string> {
	if (!config.apiKey) {
		throw new Error("OPENAI_API_KEY is not configured.");
	}

	const response = await fetch(OPENAI_URL, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${config.apiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model: config.model || DEFAULT_MODEL,
			messages: [{ role: "user", content: prompt }],
		}),
	});

	if (!response.ok) {
		const detail = await response.text();
		throw new Error(
			`OpenAI request failed with status ${response.status}: ${detail.slice(0, 500)}`,
		);
	}

	const data = (await response.json()) as ChatCompletionResponse;
	const text = data.choices?.[0]?.message?.content;
	if (typeof text !== "string") {
		throw new Error("OpenAI response did not contain a completion.");
	}
	return text;
}
