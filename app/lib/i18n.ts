import { m } from "@shared/paraglide/messages";
import { baseLocale, getLocale, locales, setLocale } from "@shared/paraglide/runtime";

export { baseLocale, getLocale, locales, m, setLocale };

export type Locale = (typeof locales)[number];

export const localeLabels: Record<string, string> = {
	"pt-br": "Português",
	en: "English",
};

export function changeLocale(locale: string) {
	setLocale(locale as Locale);
}
