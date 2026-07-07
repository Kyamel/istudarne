import { cx } from "../../lib/classes";

type StatusMessageProps = {
	children: string;
	tone?: "info" | "danger";
	role?: "status" | "alert";
};

export default function StatusMessage({
	children,
	tone = "info",
	role = "status",
}: StatusMessageProps) {
	return (
		<p
			className={cx(
				"rounded-field border border-edge border-l-4 p-3.5 text-fg",
				tone === "danger" ? "border-l-danger bg-danger-soft" : "border-l-primary bg-surface-muted",
			)}
			role={role}
		>
			{children}
		</p>
	);
}
