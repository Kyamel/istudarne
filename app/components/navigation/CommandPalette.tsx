import { useEffect, useRef, useState } from "react";
import { cx } from "../../lib/classes";

export type Command = {
	id: string;
	label: string;
	/* Extra terms the filter should match besides the label. */
	keywords?: string;
	/* Short hint rendered on the right side (e.g. a shortcut or category). */
	hint?: string;
	run: () => void;
};

type CommandPaletteProps = {
	open: boolean;
	onClose: () => void;
	commands: Command[];
	placeholder: string;
	emptyLabel: string;
};

/* Obsidian-style command palette: a centered modal with a search input and a
   keyboard-navigable list of actions. Opens via Ctrl/Cmd+K or Ctrl/Cmd+P. */
export default function CommandPalette({
	open,
	onClose,
	commands,
	placeholder,
	emptyLabel,
}: CommandPaletteProps) {
	const [query, setQuery] = useState("");
	const [active, setActive] = useState(0);
	const inputRef = useRef<HTMLInputElement | null>(null);

	const normalized = query.trim().toLowerCase();
	const matches = normalized
		? commands.filter((command) =>
				`${command.label} ${command.keywords ?? ""}`.toLowerCase().includes(normalized),
			)
		: commands;

	useEffect(() => {
		if (!open) return;
		setQuery("");
		setActive(0);
		inputRef.current?.focus();
	}, [open]);

	if (!open) return null;

	function runCommand(command: Command) {
		onClose();
		command.run();
	}

	function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
		if (event.key === "Escape") {
			event.preventDefault();
			onClose();
		} else if (event.key === "ArrowDown") {
			event.preventDefault();
			setActive((value) => Math.min(matches.length - 1, value + 1));
		} else if (event.key === "ArrowUp") {
			event.preventDefault();
			setActive((value) => Math.max(0, value - 1));
		} else if (event.key === "Enter") {
			event.preventDefault();
			const command = matches[Math.min(active, matches.length - 1)];
			if (command) runCommand(command);
		}
	}

	return (
		<div className="fixed inset-0 z-50">
			<button
				aria-label={placeholder}
				className="absolute inset-0 h-full w-full cursor-default border-0 bg-black/50"
				onClick={onClose}
				type="button"
			/>
			<div
				aria-label={placeholder}
				aria-modal="true"
				className="relative mx-auto mt-[15vh] w-[min(100%-2rem,560px)] overflow-hidden rounded-panel border border-edge bg-surface shadow-modal"
				role="dialog"
			>
				<input
					className="w-full border-b border-edge bg-transparent px-4 py-3.5 text-fg outline-none placeholder:text-fg-soft"
					onChange={(event) => {
						setQuery(event.target.value);
						setActive(0);
					}}
					onKeyDown={handleInputKeyDown}
					placeholder={placeholder}
					ref={inputRef}
					type="text"
					value={query}
				/>
				<div className="max-h-80 overflow-y-auto p-1.5">
					{matches.length === 0 ? (
						<p className="px-3 py-2.5 text-fg-muted">{emptyLabel}</p>
					) : (
						matches.map((command, index) => (
							<button
								className={cx(
									"flex w-full cursor-pointer items-center justify-between gap-3 rounded-field border-0 px-3 py-2.5 text-left",
									index === active ? "bg-primary-soft text-fg" : "bg-transparent text-fg-muted",
								)}
								key={command.id}
								onClick={() => runCommand(command)}
								onMouseEnter={() => setActive(index)}
								type="button"
							>
								<span>{command.label}</span>
								{command.hint ? (
									<span className="text-[0.78rem] text-fg-soft">{command.hint}</span>
								) : null}
							</button>
						))
					)}
				</div>
			</div>
		</div>
	);
}
