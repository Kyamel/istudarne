/* Keyboard-accessible shortcut to jump straight to the main content. */
export default function SkipLink({ href, children }: { href: string; children: string }) {
	return (
		<a
			className="fixed -top-[100px] left-3 z-50 rounded-field bg-primary px-4 py-2.5 font-bold text-white no-underline transition-[top] duration-150 focus:top-3"
			href={href}
		>
			{children}
		</a>
	);
}
