import type { ReactNode } from "react";

export default function Eyebrow({ children }: { children: ReactNode }) {
	return (
		<p className="text-[0.78rem] font-extrabold tracking-[0.03em] text-secondary uppercase">
			{children}
		</p>
	);
}
