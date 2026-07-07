import BrandMark from "../navigation/BrandMark";

/* Fullscreen splash shown while the session is being restored. */
export default function BootScreen({ children }: { children: string }) {
	return (
		<div
			className="grid min-h-screen place-content-center justify-items-center gap-4 text-fg-muted"
			role="status"
			aria-live="polite"
		>
			<BrandMark />
			<p>{children}</p>
		</div>
	);
}
