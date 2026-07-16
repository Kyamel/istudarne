import Pill from "./Pill";

export default function TagRow({ tags }: { tags: string[] }) {
	return (
		<div className="flex flex-wrap items-center gap-2.5">
			{tags.map((tag) => (
				<Pill key={tag}>{tag}</Pill>
			))}
		</div>
	);
}
