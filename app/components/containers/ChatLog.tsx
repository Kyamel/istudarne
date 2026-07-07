import type { ReactNode, Ref } from "react";

/* Scrollable message list. The ref lets the page pin the scroll to the
   latest message when new ones arrive. */
type ChatLogProps = {
	children: ReactNode;
	ref?: Ref<HTMLDivElement>;
};

export default function ChatLog({ children, ref }: ChatLogProps) {
	return (
		<div
			className="flex max-h-90 flex-col gap-2.5 overflow-y-auto p-1"
			ref={ref}
			aria-live="polite"
		>
			{children}
		</div>
	);
}
