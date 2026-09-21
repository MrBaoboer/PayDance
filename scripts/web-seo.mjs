// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

const siteUrl = "https://paydance.vercel.app/";
const englishSiteUrl = `${siteUrl}en/`;
const repositoryUrl = "https://github.com/MrBaoboer/PayDance";

// Mirrors web.heroHeadline1 / heroHeadline2 / heroLead / downloadWindows in src/i18n/locales;
// scripts/web-seo.test.js keeps both in sync.
export const heroCopy = {
  "zh-CN": {
    headline1: "看见每一秒的",
    headline2: "收入跳动",
    lead: "具象化你的劳动价值，专注工作，也看见回报",
    download: "下载 Windows 版",
  },
  en: {
    headline1: "See Your Pay",
    headline2: "Tick Up Live",
    lead: "A wage board that tracks today’s earnings.",
    download: "Download for Windows",
  },
};

// On Vercel the button hits api/download-windows.js, which redirects to the newest versioned
// EXE; static mirrors without functions (GitHub Pages) link to the Release page instead.
export const windowsDownloadEndpoint = "/download/windows";
export const releasesPageUrl = `${repositoryUrl}/releases/latest`;
export function resolveWindowsDownloadUrl({ vercel = false } = {}) {
  return vercel ? windowsDownloadEndpoint : releasesPageUrl;
}

export function resolveBuildDate(environment = process.env, now = new Date()) {
  const sourceDateEpoch = Number(environment.SOURCE_DATE_EPOCH);
  const buildDate =
    Number.isFinite(sourceDateEpoch) && sourceDateEpoch > 0
      ? new Date(sourceDateEpoch * 1000)
      : now;

  return buildDate.toISOString().slice(0, 10);
}

export function replaceSeoTokens(html, { version, dateModified }) {
  return html
    .replaceAll("__PAYDANCE_VERSION__", version)
    .replaceAll("__PAYDANCE_DATE_MODIFIED__", dateModified);
}

export function createSitemap(dateModified) {
  const entries = [
    { url: siteUrl, priority: "1.0" },
    { url: englishSiteUrl, priority: "0.9" },
  ];
  const urls = entries
    .map(
      ({ url, priority }) => `  <url>
    <loc>${url}</loc>
    <lastmod>${dateModified}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

export function resolveHtmlLocale(html) {
  return /<html[^>]*\slang="en"/i.test(html) ? "en" : "zh-CN";
}

const escapeHtml = (value) =>
  value.replace(
    /[&<>"]/g,
    (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character],
  );

// Static copy of the hero so crawlers that skip JavaScript still read the headline, the lead
// and the download link. Vue replaces the whole #app subtree on mount.
export function createHeroPlaceholder(locale, windowsDownloadUrl) {
  const copy = heroCopy[locale] ?? heroCopy["zh-CN"];

  return [
    '<main class="web-preview theme-light">',
    '<section class="web-preview__hero">',
    '<div class="web-preview__copy">',
    `<h1><span class="web-preview__headline-main">${escapeHtml(copy.headline1)}</span>`,
    `<span class="web-preview__headline-accent">${escapeHtml(copy.headline2)}</span></h1>`,
    `<p class="web-preview__lead">${escapeHtml(copy.lead)}</p>`,
    '<nav class="web-preview__actions">',
    `<a class="web-preview__action web-preview__action--primary" href="${escapeHtml(windowsDownloadUrl)}">${escapeHtml(copy.download)}</a>`,
    "</nav></div></section></main>",
  ].join("");
}

export function injectHeroPlaceholder(html, locale, windowsDownloadUrl) {
  return html.replace(
    '<div id="app"></div>',
    `<div id="app">${createHeroPlaceholder(locale, windowsDownloadUrl)}</div>`,
  );
}

export function createFontPreloadTags(bundle, base = "/") {
  return Object.keys(bundle ?? {})
    .filter((fileName) => fileName.endsWith(".woff2"))
    .sort()
    .map((fileName) => ({
      tag: "link",
      attrs: {
        rel: "preload",
        as: "font",
        type: "font/woff2",
        href: `${base}${fileName}`,
        crossorigin: true,
      },
      injectTo: "head",
    }));
}

// Vercel Web Analytics is cookie-free and only exists on the Vercel deployment; the GitHub
// Pages mirror and the desktop app never load it.
export const vercelAnalyticsTag = {
  tag: "script",
  attrs: { defer: true, src: "/_vercel/insights/script.js" },
  injectTo: "body",
};

export function createWebSeoPlugin({
  dateModified,
  emitSitemap,
  heroPlaceholder = false,
  preloadFonts = false,
  vercelAnalytics = false,
  version,
  windowsDownloadUrl = resolveWindowsDownloadUrl(),
}) {
  let base = "/";

  return {
    name: "paydance-web-seo",
    configResolved(config) {
      base = config.base;
    },
    transformIndexHtml: {
      order: "post",
      handler(html, context) {
        let output = replaceSeoTokens(html, { version, dateModified });
        if (heroPlaceholder) {
          output = injectHeroPlaceholder(
            output,
            resolveHtmlLocale(output),
            windowsDownloadUrl,
          );
        }

        const tags = [];
        if (preloadFonts) tags.push(...createFontPreloadTags(context?.bundle, base));
        if (vercelAnalytics) tags.push(vercelAnalyticsTag);

        return { html: output, tags };
      },
    },
    generateBundle() {
      if (!emitSitemap) return;

      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source: createSitemap(dateModified),
      });
    },
  };
}
