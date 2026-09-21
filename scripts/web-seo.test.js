// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { describe, expect, it } from "vitest";
import en from "../src/i18n/locales/en.ts";
import zhCN from "../src/i18n/locales/zh-CN.ts";
import {
  createFontPreloadTags,
  createHeroPlaceholder,
  createSitemap,
  createWebSeoPlugin,
  heroCopy,
  injectHeroPlaceholder,
  replaceSeoTokens,
  resolveBuildDate,
  resolveHtmlLocale,
  resolveWindowsDownloadUrl,
  vercelAnalyticsTag,
} from "./web-seo.mjs";

describe("web SEO build helpers", () => {
  it("uses SOURCE_DATE_EPOCH when supplied and otherwise the UTC build date", () => {
    expect(
      resolveBuildDate(
        { SOURCE_DATE_EPOCH: "1781481600" },
        new Date("2030-01-02T23:59:59Z"),
      ),
    ).toBe("2026-06-15");
    expect(resolveBuildDate({}, new Date("2030-01-02T23:59:59Z"))).toBe("2030-01-02");
  });

  it("replaces version and date placeholders in every HTML entry", () => {
    expect(
      replaceSeoTokens(
        '"softwareVersion":"__PAYDANCE_VERSION__","dateModified":"__PAYDANCE_DATE_MODIFIED__"',
        { version: "1.2.3", dateModified: "2030-01-02" },
      ),
    ).toBe('"softwareVersion":"1.2.3","dateModified":"2030-01-02"');
  });

  it("creates a sitemap for the Chinese and English canonical URLs", () => {
    const sitemap = createSitemap("2030-01-02");

    expect(sitemap).toContain("<loc>https://paydance.vercel.app/</loc>");
    expect(sitemap).toContain("<loc>https://paydance.vercel.app/en/</loc>");
    expect(sitemap.match(/<lastmod>2030-01-02<\/lastmod>/g)).toHaveLength(2);
  });
});

describe("web preview static hero", () => {
  const downloadUrl = resolveWindowsDownloadUrl();

  it("keeps the placeholder copy identical to the i18n bundles", () => {
    for (const [locale, messages] of [
      ["zh-CN", zhCN],
      ["en", en],
    ]) {
      expect(heroCopy[locale]).toEqual({
        headline1: messages["web.heroHeadline1"],
        headline2: messages["web.heroHeadline2"],
        lead: messages["web.heroLead"],
        download: messages["web.downloadWindows"],
      });
    }
  });

  it("pre-renders the headline, lead and download link inside #app", () => {
    const html = injectHeroPlaceholder(
      '<html lang="en"><body><div id="app"></div></body></html>',
      resolveHtmlLocale('<html lang="en">'),
      downloadUrl,
    );

    expect(html).toContain('<div id="app"><main class="web-preview theme-light">');
    expect(html).toContain("See Your Pay");
    expect(html).toContain("Tick Up Live");
    expect(html).toContain(`href="${downloadUrl}"`);
    expect(html).toContain("</main></div>");
    expect(createHeroPlaceholder("zh-CN", downloadUrl)).toContain("看见每一秒的");
    expect(resolveHtmlLocale('<html lang="zh-CN">')).toBe("zh-CN");
  });

  it("sends Vercel visitors through the download endpoint and mirrors to the Release page", () => {
    expect(resolveWindowsDownloadUrl({ vercel: true })).toBe("/download/windows");
    expect(downloadUrl).toBe("https://github.com/MrBaoboer/PayDance/releases/latest");
  });

  it("preloads every emitted woff2 font under the configured base", () => {
    const tags = createFontPreloadTags(
      {
        "assets/main-abc.js": {},
        "assets/paydance-web-serif-subset-def.woff2": {},
        "assets/paydance-web-sans-subset-ghi.woff2": {},
      },
      "/PayDance/",
    );

    expect(tags.map((tag) => tag.attrs.href)).toEqual([
      "/PayDance/assets/paydance-web-sans-subset-ghi.woff2",
      "/PayDance/assets/paydance-web-serif-subset-def.woff2",
    ]);
    expect(tags[0]).toMatchObject({
      tag: "link",
      attrs: { rel: "preload", as: "font", type: "font/woff2", crossorigin: true },
      injectTo: "head",
    });
    expect(createFontPreloadTags(undefined)).toEqual([]);
  });

  it("only injects the placeholder, preloads and analytics when asked", () => {
    const html = '<html lang="zh-CN"><body><div id="app"></div></body></html>';
    const bundle = { "assets/font.woff2": {} };
    const quiet = createWebSeoPlugin({ dateModified: "2030-01-02", version: "1.2.3" });
    const web = createWebSeoPlugin({
      dateModified: "2030-01-02",
      heroPlaceholder: true,
      preloadFonts: true,
      vercelAnalytics: true,
      version: "1.2.3",
    });

    expect(quiet.transformIndexHtml.handler(html, { bundle })).toEqual({
      html,
      tags: [],
    });

    const result = web.transformIndexHtml.handler(html, { bundle });
    expect(result.html).toContain("看见每一秒的");
    expect(result.tags).toEqual([
      expect.objectContaining({
        attrs: expect.objectContaining({ href: "/assets/font.woff2" }),
      }),
      vercelAnalyticsTag,
    ]);
    expect(vercelAnalyticsTag.attrs.src).toBe("/_vercel/insights/script.js");
  });
});
