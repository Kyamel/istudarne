import type { FormHTMLAttributes } from "react";
import { cx } from "../../lib/classes";

/* A <form> styled as a card, used by the create-group and upload flows. */
export default function FormCard({ className, ...props }: FormHTMLAttributes<HTMLFormElement>) {
	return (
		<form
			className={cx(
				"grid gap-4 rounded-card border border-edge bg-surface p-5 shadow-card",
				className,
			)}
			{...props}
		/>
	);
}
