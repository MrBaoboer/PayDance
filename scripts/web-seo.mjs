// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

const siteUrl = "https://paydance.vercel.app/";
const englishSiteUrl = `${siteUrl}en/`;

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

export function createWebSeoPlugin({ dateModified, emitSitemap, version }) {
  return {
    name: "paydance-web-seo",
    transformIndexHtml(html) {
      return replaceSeoTokens(html, { version, dateModified });
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
