import { Link } from "react-router-dom";
import BrandMark from "./BrandMark";

/* App wordmark: logo square plus name, with an optional tagline.
   Renders as a link when `to` is given (shell), or as static text (login). */
type BrandProps = {
	to?: string;
	tagline?: string;
};

export default function Brand({ to, tagline }: BrandProps) {
	const content = (
		<>
			<BrandMark />
			<span>
				<strong className="block">Istudarne</strong>
				{tagline ? <small className="block text-fg-muted">{tagline}</small> : null}
			</span>
		</>
	);
	const className = "flex items-center gap-3 no-underline";

	if (to) {
		return (
			<Link className={className} to={to}>
				{content}
			</Link>
		);
	}
	return <span className={className}>{content}</span>;
}
