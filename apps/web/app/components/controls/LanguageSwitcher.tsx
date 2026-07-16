import { changeLocale, getLocale, localeLabels, locales, m } from "../../lib/i18n";

export default function LanguageSwitcher() {
	return (
		<label className="block">
			<span className="sr-only">{m.common_language()}</span>
			<select
				aria-label={m.common_language()}
				className="min-h-11 w-full cursor-pointer rounded-field border border-edge bg-surface px-3 text-fg"
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
