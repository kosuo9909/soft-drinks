const LOCALE_STORAGE_KEY = 'app-locale';

export const AVAILABLE_LOCALES = ['en-GB', 'bg-BG'] as const;

export type Locale = (typeof AVAILABLE_LOCALES)[number];

export function getLocale(): Locale {
  const localeValue =
    localStorage.getItem(LOCALE_STORAGE_KEY) ??
    sessionStorage.getItem(LOCALE_STORAGE_KEY);

  const locale =
    localeValue ??
    AVAILABLE_LOCALES.find((lang) =>
      navigator.language.startsWith(lang.slice(0, 2))
    ) ??
    AVAILABLE_LOCALES[0];

  return locale as Locale;
}

export function setLocale(locale: string, storage: Storage): void {
  storage.setItem(LOCALE_STORAGE_KEY, locale);
  window.document.documentElement.lang = locale;
}

// Module types vary, and we don't particularly care about the specific one
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function importLocale(locale: Locale) {
  let importLocalePromise;
  switch (locale) {
    case 'bg-BG':
      importLocalePromise = import('@angular/common/locales/bg');
      break;
    default:
      importLocalePromise = import('@angular/common/locales/en-GB');
      break;
  }

  return importLocalePromise;
}
