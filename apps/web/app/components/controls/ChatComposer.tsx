import type { SubmitEvent } from "react";
import Button from "./Button";

/* Single-line message input with a send action, wired to a controlled value. */
type ChatComposerProps = {
	value: string;
	onChange: (value: string) => void;
	onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
	label: string;
	placeholder: string;
	sendLabel: string;
	disabled?: boolean;
	maxLength?: number;
};

export default function ChatComposer({
	value,
	onChange,
	onSubmit,
	label,
	placeholder,
	sendLabel,
	disabled,
	maxLength = 2000,
}: ChatComposerProps) {
	return (
		<form className="flex gap-2.5" onSubmit={onSubmit}>
			<label className="sr-only" htmlFor="chat-input">
				{label}
			</label>
			<input
				autoComplete="off"
				className="min-h-12 w-full flex-1 rounded-field border border-edge bg-surface-raised px-3.5 py-3 text-fg placeholder:text-fg-soft"
				id="chat-input"
				maxLength={maxLength}
				onChange={(event) => onChange(event.target.value)}
				placeholder={placeholder}
				value={value}
			/>
			<Button variant="primary" disabled={disabled} type="submit">
				{sendLabel}
			</Button>
		</form>
	);
}
