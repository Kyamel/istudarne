import { changeLocale, getLocale, localeLabels, locales, m } from "../lib/i18n";
import styles from "./LanguageSwitcher.module.css";

export default function LanguageSwitcher() {
	return (
		<label className={styles.switcher}>
			<span className={styles.srOnly}>{m.common_language()}</span>
			<select
				aria-label={m.common_language()}
				className={styles.select}
				defaultValue={getLocale()}
				onChange={(event) => changeLocale(event.target.value)}
			>
				{locales.map((locale) => (
					<option key={locale} value={locale}>
						{localeLabels[locale] ?? locale}
					</option>
				))}
			</select>
		</label>
	);
}
