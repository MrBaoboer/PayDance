// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { describe, expect, it } from "vitest";
import { createSitemap, replaceSeoTokens, resolveBuildDate } from "./web-seo.mjs";

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
