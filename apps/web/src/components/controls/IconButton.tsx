import type { ButtonHTMLAttributes } from "react";
import { cx } from "../../lib/classes";

export default function IconButton({
	className,
	...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
	return (
		<button
			className={cx(
				"inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-field border border-edge bg-surface text-[1.3rem] text-fg",
				className,
			)}
			type="button"
			{...props}
		/>
	);
}
