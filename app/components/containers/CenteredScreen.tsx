import type { ReactNode } from "react";

/* Fullscreen centered layout used by standalone screens such as login. */
export default function CenteredScreen({ children }: { children: ReactNode }) {
	return <div className="grid min-h-screen place-items-center bg-canvas p-4">{children}</div>;
}
