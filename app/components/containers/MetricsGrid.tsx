import type { ReactNode } from "react";

export default function MetricsGrid({ children }: { children: ReactNode }) {
	return <div className="grid grid-cols-2 gap-4 min-[720px]:grid-cols-4">{children}</div>;
}
