import type { ReactNode } from "react";

export default function CenterActions({ children }: { children: ReactNode }) {
	return <div className="flex flex-wrap justify-center gap-3">{children}</div>;
}
