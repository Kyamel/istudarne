/* Dimmed click-target behind the mobile navigation drawer. */
export default function Backdrop({ label, onClick }: { label: string; onClick: () => void }) {
	return (
		<button
			aria-label={label}
			className="fixed inset-0 z-[35] cursor-pointer border-0 bg-[rgba(20,18,15,0.45)] desktop:hidden"
			onClick={onClick}
			type="button"
		/>
	);
}
