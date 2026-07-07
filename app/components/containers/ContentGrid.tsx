import type { ReactNode } from "react";

export default function ContentGrid({ children }: { children: ReactNode }) {
	return <section className="grid gap-4 min-[720px]:grid-cols-2">{children}</section>;
}
