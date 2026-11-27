// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

// Edge-cached SVG downloads badge (/badge/downloads, see vercel.json).
// Shields.io's /github/downloads/.../total paginates dozens of releases on cold cache
// and regularly exceeds GitHub Camo's ~4s proxy timeout. Fetching per_page=100 directly
// with Vercel stale-while-revalidate keeps the README badge fast and reliable.

export const releasesApiBaseUrl =
  "https://api.github.com/repos/MrBaoboer/PayDance/releases";

const perPage = 100;
const maxPages = 10;
const totalTimeoutMs = 3500;
const defaultLabel = "downloads";
const defaultLabelColor = "#1f2328";
const defaultValueColor = "#3d444d";
const fallbackValueText = "releases";

// Warm serverless instance fallback so a brief GitHub hiccup still shows the last real total,
// and single-page conditional requests (304) consume zero GitHub API rate-limit quota.
let lastKnownTotal = null;
let lastSinglePageEtag = null;

export function resetBadgeCacheForTests() {
  lastKnownTotal = null;
  lastSinglePageEtag = null;
}

export function sumReleaseDownloads(releases) {
  if (!Array.isArray(releases)) return 0;

  let total = 0;
  for (const release of releases) {
    if (!release || release.draft === true || !Array.isArray(release.assets)) {
      continue;
    }
    for (const asset of release.assets) {
      const count = asset?.download_count;
      if (typeof count === "number" && Number.isFinite(count) && count > 0) {
        total += Math.floor(count);
      }
    }
  }

  return total;
}

const trimTrailingZero = (formatted) =>
  formatted.endsWith(".0") ? formatted.slice(0, -2) : formatted;

export function formatDownloadCount(total) {
  const safeTotal =
    typeof total === "number" && Number.isFinite(total) && total > 0
      ? Math.floor(total)
      : 0;

  if (safeTotal < 1_000) return String(safeTotal);
  if (safeTotal < 99_950) {
    return `${trimTrailingZero((safeTotal / 1_000).toFixed(1))}k`;
  }
  if (safeTotal < 999_500) {
    return `${Math.round(safeTotal / 1_000)}k`;
  }
  return `${trimTrailingZero((safeTotal / 1_000_000).toFixed(1))}M`;
}

const escapeXml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

// Approximates Verdana 11px advance widths (matching Shields.io flat badge proportions).
const charWidth11px = (char) => {
  if (char === "i" || char === "l" || char === "I") return 3.2;
  if (char === "." || char === ",") return 4.0;
  if (char === "r" || char === "t" || char === "f" || char === "j") return 4.7;
  if (char === "s" || char === "c" || char === "z") return 5.8;
  if (char === "k") return 6.5;
  if (char >= "0" && char <= "9") return 7.0;
  if (char === "w" || char === "m" || char === "M" || char === "W") return 9.2;
  return 6.7;
};

const measureTextWidth = (text) => {
  let width = 0;
  for (const char of String(text)) {
    width += charWidth11px(char);
  }
  return Math.round(width);
};

export function renderDownloadsBadgeSvg(
  valueText,
  {
    color = defaultValueColor,
    label = defaultLabel,
    labelColor = defaultLabelColor,
  } = {},
) {
  const safeLabel = escapeXml(label);
  const safeValue = escapeXml(valueText);
  const ariaLabel = `${safeLabel}: ${safeValue}`;

  const labelTextWidth = label === defaultLabel ? 59 : measureTextWidth(label);
  const valueTextWidth = Math.max(16, measureTextWidth(valueText));
  const leftWidth = labelTextWidth + 10;
  const rightWidth = valueTextWidth + 10;
  const totalWidth = leftWidth + rightWidth;

  const leftTextX = Math.round((leftWidth / 2) * 10 + 10);
  const rightTextX = Math.round((leftWidth + rightWidth / 2) * 10 - 10);

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="${ariaLabel}">`,
    `<title>${ariaLabel}</title>`,
    `<linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>`,
    `<clipPath id="r"><rect width="${totalWidth}" height="20" rx="3" fill="#fff"/></clipPath>`,
    `<g clip-path="url(#r)">`,
    `<rect width="${leftWidth}" height="20" fill="${escapeXml(labelColor)}"/>`,
    `<rect x="${leftWidth}" width="${rightWidth}" height="20" fill="${escapeXml(color)}"/>`,
    `<rect width="${totalWidth}" height="20" fill="url(#s)"/>`,
    `</g>`,
    `<g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110">`,
    `<text aria-hidden="true" x="${leftTextX}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${labelTextWidth * 10}">${safeLabel}</text>`,
    `<text x="${leftTextX}" y="140" transform="scale(.1)" fill="#fff" textLength="${labelTextWidth * 10}">${safeLabel}</text>`,
    `<text aria-hidden="true" x="${rightTextX}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${valueTextWidth * 10}">${safeValue}</text>`,
    `<text x="${rightTextX}" y="140" transform="scale(.1)" fill="#fff" textLength="${valueTextWidth * 10}">${safeValue}</text>`,
    `</g>`,
    `</svg>`,
  ].join("");
}

export async function fetchTotalDownloads(
  fetchImpl = fetch,
  { ifNoneMatch = null } = {},
) {
  const baseHeaders = {
    accept: "application/vnd.github+json",
    "user-agent": "paydance-downloads-badge",
    "x-github-api-version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) {
    baseHeaders.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const deadline = Date.now() + totalTimeoutMs;
  let total = 0;

  try {
    for (let page = 1; page <= maxPages; page += 1) {
      const remainingMs = deadline - Date.now();
      if (remainingMs <= 0) {
        return { etag: null, notModified: false, resolved: false, total: null };
      }

      const headers =
        page === 1 && ifNoneMatch
          ? { ...baseHeaders, "if-none-match": ifNoneMatch }
          : baseHeaders;

      const url = `${releasesApiBaseUrl}?per_page=${perPage}&page=${page}`;
      const response = await fetchImpl(url, {
        headers,
        signal: AbortSignal.timeout(remainingMs),
      });
      if (page === 1 && response.status === 304 && ifNoneMatch) {
        return { etag: ifNoneMatch, notModified: true, resolved: true, total: null };
      }
      if (!response.ok) {
        return { etag: null, notModified: false, resolved: false, total: null };
      }

      const releases = await response.json();
      if (!Array.isArray(releases)) {
        return { etag: null, notModified: false, resolved: false, total: null };
      }

      total += sumReleaseDownloads(releases);
      if (releases.length < perPage) {
        const etag = page === 1 ? (response.headers?.get?.("etag") ?? null) : null;
        return { etag, notModified: false, resolved: true, total };
      }
    }

    return { etag: null, notModified: false, resolved: true, total };
  } catch {
    return { etag: null, notModified: false, resolved: false, total: null };
  }
}

export default async function handler(request, response) {
  const canUseEtag =
    typeof lastKnownTotal === "number" && typeof lastSinglePageEtag === "string";
  const { etag, notModified, resolved, total } = await fetchTotalDownloads(fetch, {
    ifNoneMatch: canUseEtag ? lastSinglePageEtag : null,
  });

  let valueText = fallbackValueText;
  let cacheControl = "no-store";

  if (resolved && notModified && typeof lastKnownTotal === "number") {
    valueText = formatDownloadCount(lastKnownTotal);
    cacheControl = "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400";
  } else if (resolved && typeof total === "number") {
    lastKnownTotal = total;
    lastSinglePageEtag = etag;
    valueText = formatDownloadCount(total);
    cacheControl = "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400";
  } else if (typeof lastKnownTotal === "number") {
    valueText = formatDownloadCount(lastKnownTotal);
    cacheControl = "public, max-age=60, s-maxage=60, stale-while-revalidate=86400";
  }

  response.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
  response.setHeader("Cache-Control", cacheControl);
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  response.setHeader("Content-Security-Policy", "script-src 'none';");
  response.statusCode = 200;
  response.end(
    request?.method === "HEAD" ? undefined : renderDownloadsBadgeSvg(valueText),
  );
}
