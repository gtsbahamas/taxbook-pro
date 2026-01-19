/**
 * Server-side i18n - taxbook-pro
 * Generated: 2026-01-19
 *
 * Server-only i18n utilities using next/headers.
 *
 * Usage:
 *   Server: const { t, locale } = await getServerTranslation();
 *   Client: import { useTranslation } from '@/lib/i18n/client';
 *
 * NOTE: This module uses next/headers and can only be imported in Server Components.
 * For client components, import from '@/lib/i18n/client' or '@/lib/i18n/shared'.
 */

import { cookies, headers } from 'next/headers';

// Re-export shared types and utilities
export * from './shared';

import {
  type SupportedLocale,
  type TranslationKey,
  type TranslateFunction,
  DEFAULT_LOCALE,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatNumber,
  formatCurrency,
  formatPercent,
  isValidLocale,
} from './shared';

// ============================================================
// TRANSLATIONS LOADER
// ============================================================

type Translations = Record<TranslationKey, string>;

// Cache for loaded translations
const translationsCache: Partial<Record<SupportedLocale, Translations>> = {};

/**
 * Load translations for a locale.
 */
async function loadTranslations(locale: SupportedLocale): Promise<Translations> {
  if (translationsCache[locale]) {
    return translationsCache[locale]!;
  }

  try {
    const translations = await import(`./locales/${locale}.json`);
    translationsCache[locale] = translations.default as Translations;
    return translationsCache[locale]!;
  } catch {
    console.warn(`Failed to load translations for locale: ${locale}, falling back to ${DEFAULT_LOCALE}`);
    if (locale !== DEFAULT_LOCALE) {
      return loadTranslations(DEFAULT_LOCALE);
    }
    throw new Error(`Failed to load default translations`);
  }
}

// ============================================================
// INTERPOLATION & PLURALIZATION
// ============================================================

interface TranslateOptions {
  readonly values?: Record<string, string | number>;
  readonly count?: number;
  readonly defaultValue?: string;
}

function interpolate(text: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll('', String(value)),
    text
  );
}

function getPluralForm(count: number): 'zero' | 'one' | 'other' {
  if (count === 0) return 'zero';
  if (count === 1) return 'one';
  return 'other';
}

function pluralize(text: string, count: number): string {
  const forms = text.split('|');
  if (forms.length === 1) return text;
  if (forms.length === 2) return count === 1 ? forms[0] : forms[1];
  if (forms.length >= 3) {
    const pluralForm = getPluralForm(count);
    const index = pluralForm === 'zero' ? 0 : pluralForm === 'one' ? 1 : 2;
    return forms[index] || forms[forms.length - 1];
  }
  return text;
}

function createTranslateFunction(
  translations: Translations,
  locale: SupportedLocale
): TranslateFunction {
  return (key: TranslationKey, options: TranslateOptions = {}): string => {
    let text = translations[key];
    if (!text) {
      console.warn(`Missing translation for key: ${key} in locale: ${locale}`);
      return options.defaultValue ?? key;
    }
    if (typeof options.count === 'number') {
      text = pluralize(text, options.count);
      options = { ...options, values: { ...options.values, count: options.count } };
    }
    if (options.values) {
      text = interpolate(text, options.values);
    }
    return text;
  };
}

// ============================================================
// SERVER-SIDE LANGUAGE DETECTION
// ============================================================

/**
 * Get locale from Accept-Language header (server-side).
 */
export async function detectServerLocale(): Promise<SupportedLocale> {
  try {
    const headersList = await headers();
    const acceptLanguage = headersList.get('accept-language');

    if (acceptLanguage) {
      const languages = acceptLanguage
        .split(',')
        .map((lang) => {
          const [code, quality = 'q=1'] = lang.trim().split(';');
          return {
            code: code.split('-')[0],
            quality: parseFloat(quality.replace('q=', '')),
          };
        })
        .sort((a, b) => b.quality - a.quality);

      for (const { code } of languages) {
        if (isValidLocale(code)) {
          return code;
        }
      }
    }
  } catch {
    // Headers not available (e.g., during static generation)
  }

  return DEFAULT_LOCALE;
}

/**
 * Get user's saved locale preference from cookies.
 */
export async function getSavedLocale(): Promise<SupportedLocale | null> {
  try {
    const cookieStore = await cookies();
    const savedLocale = cookieStore.get('locale')?.value;

    if (savedLocale && isValidLocale(savedLocale)) {
      return savedLocale;
    }
  } catch {
    // Cookies not available
  }

  return null;
}

/**
 * Save user's locale preference to cookie.
 */
export async function saveLocalePreference(locale: SupportedLocale): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('locale', locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
  });
}

/**
 * Get the current locale with fallback chain.
 */
export async function getCurrentLocale(): Promise<SupportedLocale> {
  const saved = await getSavedLocale();
  if (saved) return saved;
  return detectServerLocale();
}

// ============================================================
// SERVER-SIDE TRANSLATION
// ============================================================

/**
 * Get translation function for server components.
 *
 * @example
 * export default async function Page() {
 *   const { t, locale } = await getServerTranslation();
 *   return <h1>{t('nav.home')}</h1>;
 * }
 */
export async function getServerTranslation(): Promise<{
  t: TranslateFunction;
  locale: SupportedLocale;
  formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatDateTime: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatRelativeTime: (date: Date | string | number) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (value: number, currency?: string) => string;
  formatPercent: (value: number, options?: Intl.NumberFormatOptions) => string;
}> {
  const locale = await getCurrentLocale();
  const translations = await loadTranslations(locale);
  const t = createTranslateFunction(translations, locale);

  return {
    t,
    locale,
    formatDate: (date, options) => formatDate(date, locale, options),
    formatDateTime: (date, options) => formatDateTime(date, locale, options),
    formatRelativeTime: (date) => formatRelativeTime(date, locale),
    formatNumber: (value, options) => formatNumber(value, locale, options),
    formatCurrency: (value, currency) => formatCurrency(value, locale, currency),
    formatPercent: (value, options) => formatPercent(value, locale, options),
  };
}

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
