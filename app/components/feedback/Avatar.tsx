import { cx } from "../../lib/classes";

type AvatarProps = {
	name: string;
	size?: "sm" | "lg";
};

const sizes: Record<NonNullable<AvatarProps["size"]>, string> = {
	lg: "h-[76px] w-[76px] rounded-card text-[2rem]",
	sm: "h-10 w-10 rounded-full text-base",
};

export default function Avatar({ name, size = "lg" }: AvatarProps) {
	const initial = (name || "?").slice(0, 1).toUpperCase();
	return (
		<span
			className={cx(
				"inline-flex shrink-0 items-center justify-center bg-primary font-extrabold text-white shadow-card",
				sizes[size],
			)}
			aria-hidden="true"
		>
			{initial}
		</span>
	);
}
