/* 128px web-optimized version of logo.jpg (the kept original/source). */
import logo from "~/assets/logo.webp";

/* The square logo mark. Decorative: the adjacent wordmark carries the name. */
export default function BrandMark() {
	return (
		<img
			alt=""
			aria-hidden="true"
			className="h-10.5 w-10.5 shrink-0 rounded-field object-cover shadow-card"
			src={logo}
		/>
	);
}
