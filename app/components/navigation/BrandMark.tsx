/* The square "I" logo mark. */
export default function BrandMark({ text = "I" }: { text?: string }) {
	return (
		<span className="inline-flex h-10.5 w-10.5 shrink-0 items-center justify-center rounded-field bg-primary font-extrabold text-white shadow-card">
			{text}
		</span>
	);
}
