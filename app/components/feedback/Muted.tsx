import type { ReactNode } from "react";

export default function Muted({ children }: { children: ReactNode }) {
	return <p className="text-fg-muted">{children}</p>;
}
