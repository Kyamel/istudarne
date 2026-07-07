import type { ReactNode } from "react";

/* One row inside a SimpleList: content on the left, an optional trailing
   element (tag, count, action) pinned to the right. */
type ListItemProps = {
	children: ReactNode;
	trailing?: ReactNode;
};

export default function ListItem({ children, trailing }: ListItemProps) {
	return (
		<li className="flex items-center justify-between gap-3 border-b border-edge py-2.5 [&_a]:font-semibold [&_small]:block [&_small]:text-fg-soft">
			<div>{children}</div>
			{trailing}
		</li>
	);
}
