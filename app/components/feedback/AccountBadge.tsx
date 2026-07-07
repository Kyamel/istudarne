import Avatar from "./Avatar";

/* Compact identity block shown in the sidebar footer. */
export default function AccountBadge({
	displayName,
	username,
}: {
	displayName: string;
	username: string;
}) {
	return (
		<div className="flex items-center gap-2.5">
			<Avatar name={displayName} size="sm" />
			<span>
				<strong className="block text-[0.95rem]">{displayName}</strong>
				<small className="text-fg-soft">@{username}</small>
			</span>
		</div>
	);
}
