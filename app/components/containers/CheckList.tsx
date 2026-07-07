import type { ReactNode } from "react";

export default function CheckList({ children }: { children: ReactNode }) {
	return <ul className="m-0 grid list-disc gap-1.5 pl-5">{children}</ul>;
}
