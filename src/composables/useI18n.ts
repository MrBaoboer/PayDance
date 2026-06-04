// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { computed, inject, provide, ref, type InjectionKey, type Ref } from "vue";
import { en, zhCN, type Messages } from "../i18n";

// ---------------------------------------------------------------------------
// Supported locales
// ---------------------------------------------------------------------------

export type Locale = "zh-CN" | "en";

export const supportedLocales: Locale[] = ["zh-CN", "en"];

export const localeLabels: Record<Locale, string> = {
  "zh-CN": "中文",
  en: "English",
};

// ---------------------------------------------------------------------------
// Message bundles
// ---------------------------------------------------------------------------

const bundles: Record<Locale, Messages> = {
  "zh-CN": zhCN,
  en,
};

// ---------------------------------------------------------------------------
// Detect the user's preferred locale
// ---------------------------------------------------------------------------

export function detectLocale(savedLocale: unknown, fallback: Locale = "zh-CN"): Locale {
  if (
    typeof savedLocale === "string" &&
    (savedLocale === "zh-CN" || savedLocale === "en")
  ) {
    return savedLocale;
  }

  if (typeof navigator !== "undefined") {
    const lang = navigator.language;
    if (lang.startsWith("zh")) return "zh-CN";
    if (lang.startsWith("en")) return "en";
  }

  return fallback;
}

// ---------------------------------------------------------------------------
// Injection key for provide/inject pattern
// ---------------------------------------------------------------------------

const I18N_KEY: InjectionKey<{
  locale: Ref<Locale>;
  t: Ref<(key: keyof Messages, params?: Record<string, string | number>) => string>;
  setLocale: (locale: Locale) => void;
}> = Symbol("i18n");

// ---------------------------------------------------------------------------
// Translation function factory
// ---------------------------------------------------------------------------

export function createT(
  locale: Ref<Locale> | Locale,
): (key: keyof Messages, params?: Record<string, string | number>) => string {
  const getLocale = typeof locale === "string" ? () => locale : () => locale.value;

  return function t(
    key: keyof Messages,
    params?: Record<string, string | number>,
  ): string {
    const bundle = bundles[getLocale()] ?? bundles["zh-CN"];
    const raw = bundle[key] ?? bundles["zh-CN"][key] ?? key;

    if (!params) return raw;

    let result = raw;
    for (const [paramKey, paramValue] of Object.entries(params)) {
      result = result.replace(`{${paramKey}}`, String(paramValue));
    }
    return result;
  };
}

// ---------------------------------------------------------------------------
// Root-level i18n provider (called once from DesktopApp / WebPreviewApp)
// ---------------------------------------------------------------------------

export function provideI18n(
  savedLocale: Ref<Locale>,
  onChange?: (locale: Locale) => void,
) {
  const locale = savedLocale;
  const t = computed(() => createT(locale));

  const setLocale = (next: Locale) => {
    const detectedLocale = detectLocale(next);
    locale.value = detectedLocale;
    onChange?.(detectedLocale);
  };

  const ctx = { locale, t, setLocale };
  provide(I18N_KEY, ctx);

  return ctx;
}

// ---------------------------------------------------------------------------
// Child component usage
// ---------------------------------------------------------------------------

export function useI18n() {
  const ctx = inject(I18N_KEY);
  if (!ctx) {
    // Fallback: return a static zh-CN instance (for tests / edge cases)
    const zhLocale = ref<Locale>("zh-CN");
    const fallbackT = computed(() => createT(zhLocale));
    return {
      locale: zhLocale,
      t: fallbackT,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      setLocale: (_next: Locale) => {},
    };
  }
  return ctx;
}
