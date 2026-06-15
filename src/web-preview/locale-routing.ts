// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import type { Locale } from "../composables/useI18n";

const normalizeBaseUrl = (baseUrl: string) => {
  const withLeadingSlash = baseUrl.startsWith("/") ? baseUrl : `/${baseUrl}`;
  return withLeadingSlash.endsWith("/") ? withLeadingSlash : `${withLeadingSlash}/`;
};

const normalizePathname = (pathname: string) =>
  pathname.replace(/index\.html$/, "").replace(/\/$/, "");

export function localeUrl(locale: Locale, baseUrl: string) {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  return locale === "en" ? `${normalizedBaseUrl}en/` : normalizedBaseUrl;
}

export function resolveWebLocale(pathname: string, baseUrl: string): Locale {
  const englishPath = normalizePathname(localeUrl("en", baseUrl));
  return normalizePathname(pathname) === englishPath ? "en" : "zh-CN";
}
