import { ButtonLink, CenterActions, Eyebrow, Muted, Page } from "../components";
import { m } from "../lib/i18n";
import styles from "./NotFoundPage.module.css";

export default function NotFoundPage() {
	return (
		<Page narrow>
			<article className={styles.result}>
				<Eyebrow>{m.notfound_eyebrow()}</Eyebrow>
				<h1>{m.notfound_title()}</h1>
				<Muted>{m.notfound_subtitle()}</Muted>
				<CenterActions>
					<ButtonLink to="/" variant="primary">
						{m.notfound_home()}
					</ButtonLink>
				</CenterActions>
			</article>
		</Page>
	);
}
