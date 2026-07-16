export default function Loading({ children }: { children: string }) {
	return (
		<p className="text-fg-muted" role="status">
			{children}
		</p>
	);
}
