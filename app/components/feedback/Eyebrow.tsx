import type { ReactNode } from "react";

export default function Eyebrow({ children }: { children: ReactNode }) {
	return (
		<p className="text-[0.72rem] font-extrabold tracking-[0.08em] text-secondary uppercase">
			{children}
		</p>
	);
}
