import type { ReactNode } from "react";

export default function SimpleList({ children }: { children: ReactNode }) {
	return <ul className="m-0 grid list-none gap-2.5 p-0">{children}</ul>;
}
