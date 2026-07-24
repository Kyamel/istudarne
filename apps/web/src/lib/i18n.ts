import { m } from "@istudarne/utils/paraglide";
import {
	baseLocale,
	getLocale,
	locales,
	setLocale as setParaglideLocale,
} from "@istudarne/utils/paraglide/runtime";

export type Locale = (typeof locales)[number];

export const localeLabels: Record<string, string> = {
	"pt-br": "Português",
	en: "English",
};

function isLocale(locale: string): locale is Locale {
	return (locales as readonly string[]).includes(locale);
}

export { baseLocale, getLocale, locales, m };

export function changeLocale(locale: string) {
	if (isLocale(locale)) {
		setParaglideLocale(locale);
	}
}
