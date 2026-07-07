/* The square "I" logo mark. */
export default function BrandMark({ text = "I" }: { text?: string }) {
	return (
		<span className="inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-field bg-primary font-extrabold text-white shadow-card">
			{text}
		</span>
	);
}
