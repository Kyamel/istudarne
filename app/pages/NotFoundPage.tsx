import { ButtonLink, CenterActions, Muted, Page, ResultCard } from "../components";
import { m } from "../lib/i18n";

export default function NotFoundPage() {
	return (
		<Page narrow>
			<ResultCard eyebrow={m.notfound_eyebrow()} title={m.notfound_title()}>
				<Muted>{m.notfound_subtitle()}</Muted>
				<CenterActions>
					<ButtonLink to="/" variant="primary">
						{m.notfound_home()}
					</ButtonLink>
				</CenterActions>
			</ResultCard>
		</Page>
	);
}
