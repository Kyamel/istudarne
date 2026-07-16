import type { ReactNode } from "react";

/* Navigation row where every action stretches to share the width equally. */
export default function SplitActions({ children }: { children: ReactNode }) {
	return <div className="flex justify-between gap-3 *:flex-1">{children}</div>;
}
