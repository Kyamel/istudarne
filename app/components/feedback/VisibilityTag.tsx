import { cx } from "../../lib/classes";
import { m } from "../../lib/i18n";

type Visibility = "public" | "private" | "unlisted" | "invite";

const labels: Record<Visibility, () => string> = {
	public: () => m.visibility_public(),
	private: () => m.visibility_private(),
	unlisted: () => m.visibility_unlisted(),
	invite: () => m.visibility_invite(),
};

const tones: Record<Visibility, string> = {
	public: "bg-success-soft text-success",
	private: "bg-surface-muted text-fg-muted",
	unlisted: "bg-secondary-soft text-secondary",
	invite: "bg-secondary-soft text-secondary",
};

export default function VisibilityTag({ visibility }: { visibility: Visibility }) {
	return (
		<span
			className={cx(
				"inline-flex rounded-full px-2.5 py-1 text-[0.78rem] font-bold",
				tones[visibility],
			)}
		>
			{labels[visibility]()}
		</span>
	);
}
