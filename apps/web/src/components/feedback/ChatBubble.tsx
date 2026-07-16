import { cx } from "../../lib/classes";

type ChatBubbleProps = {
	author: string;
	body: string;
	self?: boolean;
};

export default function ChatBubble({ author, body, self }: ChatBubbleProps) {
	return (
		<div
			className={cx(
				"max-w-[80%] rounded-card border px-3.5 py-2.5",
				self
					? "self-end border-[color-mix(in_srgb,var(--primary)_40%,var(--border))] bg-primary-soft"
					: "border-edge bg-surface-muted",
			)}
		>
			<span className="mb-0.5 block text-[0.74rem] font-bold text-secondary">{author}</span>
			<p className="wrap-anywhere">{body}</p>
		</div>
	);
}
