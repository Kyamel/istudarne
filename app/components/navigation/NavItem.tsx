import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { cx } from "../../lib/classes";

type NavItemProps = {
	to: string;
	end?: boolean;
	onNavigate?: () => void;
	children: ReactNode;
};

export default function NavItem({ to, end, onNavigate, children }: NavItemProps) {
	return (
		<NavLink
			to={to}
			end={end}
			className={({ isActive }) =>
				cx(
					"flex min-h-9 items-center rounded-field px-3 py-1.5 text-[0.92rem] font-medium no-underline transition-colors",
					isActive
						? "bg-primary-soft text-fg shadow-[inset_2px_0_0_var(--primary)]"
						: "text-fg-muted hover:bg-surface-muted hover:text-fg",
				)
			}
			onClick={onNavigate}
		>
			{children}
		</NavLink>
	);
}
