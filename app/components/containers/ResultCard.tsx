import type { ReactNode } from "react";
import Eyebrow from "../feedback/Eyebrow";

/* Centered card for terminal states: quiz results and the 404 page. */
type ResultCardProps = {
	eyebrow: string;
	title: string;
	children?: ReactNode;
};

export default function ResultCard({ eyebrow, title, children }: ResultCardProps) {
	return (
		<article className="grid gap-2.5 rounded-card border border-edge bg-surface p-4 text-center shadow-card">
			<Eyebrow>{eyebrow}</Eyebrow>
			<h1 className="text-[clamp(1.4rem,4vw,2rem)] leading-[1.1] tracking-tight">{title}</h1>
			{children}
		</article>
	);
}
