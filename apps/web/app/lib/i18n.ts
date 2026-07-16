import en from "../../messages/en.json";
import ptBr from "../../messages/pt-br.json";

const messageCatalog = {
	"pt-br": ptBr,
	en,
} as const;

export const baseLocale = "pt-br";
export const locales = ["pt-br", "en"] as const;

export type Locale = (typeof locales)[number];

type MessageKey = Exclude<keyof typeof ptBr, "$schema">;
type MessageParams = Record<string, string | number>;
type Messages = {
	[K in MessageKey]: (params?: MessageParams) => string;
};

const localeStorageKey = "paraglide:lang";

export const localeLabels: Record<string, string> = {
	"pt-br": "Português",
	en: "English",
};

function isLocale(locale: string): locale is Locale {
	return (locales as readonly string[]).includes(locale);
}

export function getLocale(): Locale {
	if (typeof window === "undefined") return baseLocale;
	const stored = window.localStorage.getItem(localeStorageKey);
	return stored && isLocale(stored) ? stored : baseLocale;
}

export function setLocale(locale: Locale) {
	if (typeof window === "undefined") return;
	window.localStorage.setItem(localeStorageKey, locale);
	document.documentElement.lang = locale;
}

function interpolate(message: string, params?: MessageParams) {
	if (!params) return message;
	return message.replace(/\{([^}]+)\}/g, (match, key: string) => {
		const value = params[key];
		return value === undefined ? match : String(value);
	});
}

export const m = new Proxy({} as Messages, {
	get: (_target, key: string) => {
		return (params?: MessageParams) => {
			const locale = getLocale();
			const catalog = messageCatalog[locale] as Record<string, string>;
			const fallback = messageCatalog[baseLocale] as Record<string, string>;
			return interpolate(catalog[key] ?? fallback[key] ?? key, params);
		};
	},
});

export function changeLocale(locale: string) {
	if (isLocale(locale)) {
		setLocale(locale);
	}
}
