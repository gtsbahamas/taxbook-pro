'use client';

/**
 * Client-side i18n Components - taxbook-pro
 * Generated: 2026-01-19
 *
 * React components for client-side internationalization.
 * Import server utilities from './index'.
 *
 * Usage:
 *   import { I18nProvider, useTranslation, LanguageSwitcher } from '@/lib/i18n/client';
 */

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import {
  type SupportedLocale,
  type TranslateFunction,
  SUPPORTED_LOCALES,
  LOCALE_NAMES,
  DEFAULT_LOCALE,
  detectBrowserLocale,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatNumber,
  formatCurrency,
  formatPercent,
} from './shared';

// ============================================================
// TRANSLATIONS LOADER (CLIENT-SIDE)
// ============================================================

type Translations = Record<string, string>;

// Cache for loaded translations
const translationsCache: Partial<Record<SupportedLocale, Translations>> = {};

/**
 * Load translations for a locale.
 * Uses dynamic import for code splitting.
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

/**
 * Synchronously get cached translations (for client-side after initial load).
 */
function getCachedTranslations(locale: SupportedLocale): Translations | undefined {
  return translationsCache[locale];
}

// ============================================================
// INTERPOLATION & PLURALIZATION
// ============================================================

interface TranslateOptions {
  /** Values to interpolate into the translation */
  readonly values?: Record<string, string | number>;
  /** Count for pluralization */
  readonly count?: number;
  /** Default value if key not found */
  readonly defaultValue?: string;
}

/**
 * Interpolate values into a translation string.
 */
function interpolate(text: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll('', String(value)),
    text
  );
}

/**
 * Get plural form based on count.
 */
function getPluralForm(count: number): 'zero' | 'one' | 'other' {
  if (count === 0) return 'zero';
  if (count === 1) return 'one';
  return 'other';
}

/**
 * Apply pluralization to a translation.
 */
function pluralize(text: string, count: number): string {
  const forms = text.split('|');

  if (forms.length === 1) return text;

  if (forms.length === 2) {
    return count === 1 ? forms[0] : forms[1];
  }

  if (forms.length >= 3) {
    const pluralForm = getPluralForm(count);
    const index = pluralForm === 'zero' ? 0 : pluralForm === 'one' ? 1 : 2;
    return forms[index] || forms[forms.length - 1];
  }

  return text;
}

/**
 * Create a translation function for a locale.
 */
function createTranslateFunction(
  translations: Translations,
  locale: SupportedLocale
): TranslateFunction {
  return (key: string, options: TranslateOptions = {}): string => {
    let text = translations[key];

    if (!text) {
      console.warn(`Missing translation for key: ${key} in locale: ${locale}`);
      return options.defaultValue ?? key;
    }

    if (typeof options.count === 'number') {
      text = pluralize(text, options.count);
      options = {
        ...options,
        values: { ...options.values, count: options.count },
      };
    }

    if (options.values) {
      text = interpolate(text, options.values);
    }

    return text;
  };
}

// ============================================================
// I18N CONTEXT
// ============================================================

interface I18nContextValue {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: TranslateFunction;
  isLoading: boolean;
  formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatDateTime: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatRelativeTime: (date: Date | string | number) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (value: number, currency?: string) => string;
  formatPercent: (value: number, options?: Intl.NumberFormatOptions) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

// ============================================================
// I18N PROVIDER
// ============================================================

/**
 * Provider component for i18n context.
 * Wrap your app with this to enable translations.
 *
 * @example
 * // In layout.tsx
 * export default function RootLayout({ children }: { children: ReactNode }) {
 *   return (
 *     <html>
 *       <body>
 *         <I18nProvider initialLocale="en">
 *           {children}
 *         </I18nProvider>
 *       </body>
 *     </html>
 *   );
 * }
 */
export function I18nProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
}: {
  children: ReactNode;
  initialLocale?: SupportedLocale;
}) {
  const [locale, setLocaleState] = useState<SupportedLocale>(initialLocale);
  const [translations, setTranslations] = useState<Translations | null>(
    getCachedTranslations(initialLocale) ?? null
  );
  const [isLoading, setIsLoading] = useState(!translations);

  // Load translations when locale changes
  useEffect(() => {
    const cached = getCachedTranslations(locale);
    if (cached) {
      setTranslations(cached);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    loadTranslations(locale).then((loaded) => {
      setTranslations(loaded);
      setIsLoading(false);
    });
  }, [locale]);

  // Detect browser locale on mount (only runs once)
  useEffect(() => {
    const detected = detectBrowserLocale();
    if (detected !== initialLocale) {
      setLocaleState(detected);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLocale = async (newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    // Save preference via server action
    try {
      await fetch('/api/locale', {
        method: 'POST',
        body: JSON.stringify({ locale: newLocale }),
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      // Ignore - preference will be detected again on next visit
    }
  };

  const t: TranslateFunction = translations
    ? createTranslateFunction(translations, locale)
    : (key, options) => options?.defaultValue ?? key;

  const value: I18nContextValue = {
    locale,
    setLocale,
    t,
    isLoading,
    formatDate: (date, options) => formatDate(date, locale, options),
    formatDateTime: (date, options) => formatDateTime(date, locale, options),
    formatRelativeTime: (date) => formatRelativeTime(date, locale),
    formatNumber: (val, options) => formatNumber(val, locale, options),
    formatCurrency: (val, currency) => formatCurrency(val, locale, currency),
    formatPercent: (val, options) => formatPercent(val, locale, options),
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// ============================================================
// TRANSLATION HOOK
// ============================================================

/**
 * Hook to access translations in client components.
 *
 * @example
 * 'use client';
 * import { useTranslation } from '@/lib/i18n/client';
 *
 * export function MyComponent() {
 *   const { t, locale, formatDate } = useTranslation();
 *
 *   return (
 *     <div>
 *       <h1>{t('nav.dashboard')}</h1>
 *       <p>{t('plural.item', { count: 5 })}</p>
 *       <span>{formatDate(new Date())}</span>
 *     </div>
 *   );
 * }
 */
export function useTranslation(): I18nContextValue {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }

  return context;
}

// ============================================================
// LANGUAGE SWITCHER COMPONENT
// ============================================================

/**
 * Props for the LanguageSwitcher component.
 */
interface LanguageSwitcherProps {
  className?: string;
}

/**
 * Language switcher dropdown component.
 *
 * @example
 * <LanguageSwitcher className="w-32" />
 */
export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { locale, setLocale, isLoading } = useTranslation();

  return (
    <select
      value={locale}
      onChange={(e) => setLocale(e.target.value as SupportedLocale)}
      disabled={isLoading}
      className={className}
      aria-label="Select language"
    >
      {SUPPORTED_LOCALES.map((loc) => (
        <option key={loc} value={loc}>
          {LOCALE_NAMES[loc]}
        </option>
      ))}
    </select>
  );
}

// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
