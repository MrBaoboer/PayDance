// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import handler, {
  fetchTotalDownloads,
  formatDownloadCount,
  releasesApiBaseUrl,
  renderDownloadsBadgeSvg,
  resetBadgeCacheForTests,
  sumReleaseDownloads,
} from "./downloads-badge.js";

const jsonResponse = (body, status = 200, headers = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: new Headers(headers),
  json: async () => body,
});

const fakeResponse = () => {
  const headers = {};
  return {
    body: "",
    ended: false,
    headers,
    statusCode: 200,
    setHeader(name, value) {
      headers[name.toLowerCase()] = value;
    },
    end(payload = "") {
      this.body = payload;
      this.ended = true;
    },
  };
};

describe("downloads badge endpoint", () => {
  afterEach(() => {
    resetBadgeCacheForTests();
    vi.unstubAllGlobals();
  });

  it("sums download counts across all non-draft release assets", () => {
    expect(
      sumReleaseDownloads([
        {
          draft: false,
          assets: [{ download_count: 120 }, { download_count: 80 }],
        },
        {
          draft: true,
          assets: [{ download_count: 999 }],
        },
        {
          draft: false,
          assets: [
            { download_count: -5 },
            { download_count: "bad" },
            { download_count: 50 },
          ],
        },
      ]),
    ).toBe(250);
  });

  it("formats download counts cleanly like Shields.io metric badges", () => {
    expect(formatDownloadCount(0)).toBe("0");
    expect(formatDownloadCount(131)).toBe("131");
    expect(formatDownloadCount(999)).toBe("999");
    expect(formatDownloadCount(1_000)).toBe("1k");
    expect(formatDownloadCount(8_672)).toBe("8.7k");
    expect(formatDownloadCount(10_000)).toBe("10k");
    expect(formatDownloadCount(12_340)).toBe("12.3k");
    expect(formatDownloadCount(99_950)).toBe("100k");
    expect(formatDownloadCount(999_500)).toBe("1M");
    expect(formatDownloadCount(1_250_000)).toBe("1.3M");
  });

  it("renders a flat Shields-compatible SVG badge with escaped content", () => {
    const svg = renderDownloadsBadgeSvg("8.7k");

    expect(svg).toContain('height="20"');
    expect(svg).toContain('aria-label="downloads: 8.7k"');
    expect(svg).toContain("<title>downloads: 8.7k</title>");
    expect(svg).toContain('fill="#1f2328"');
    expect(svg).toContain('fill="#3d444d"');
    expect(svg).toContain(">8.7k</text>");

    const escaped = renderDownloadsBadgeSvg("<script>&");
    expect(escaped).not.toContain("<script>");
    expect(escaped).toContain("&lt;script&gt;&amp;");
  });

  it("fetches all releases in one request under 100 releases and paginates beyond 100", async () => {
    const singlePageFetch = vi.fn(async () =>
      jsonResponse([{ draft: false, assets: [{ download_count: 8_672 }] }], 200, {
        etag: 'W/"page1-etag"',
      }),
    );
    await expect(fetchTotalDownloads(singlePageFetch)).resolves.toEqual({
      etag: 'W/"page1-etag"',
      notModified: false,
      resolved: true,
      total: 8_672,
    });
    expect(singlePageFetch).toHaveBeenCalledTimes(1);
    expect(singlePageFetch).toHaveBeenCalledWith(
      `${releasesApiBaseUrl}?per_page=100&page=1`,
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }),
    );

    const hundredReleases = Array.from({ length: 100 }, () => ({
      draft: false,
      assets: [{ download_count: 10 }],
    }));
    const multiPageFetch = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(hundredReleases, 200, { etag: 'W/"p1"' }))
      .mockResolvedValueOnce(
        jsonResponse([{ draft: false, assets: [{ download_count: 25 }] }]),
      );

    await expect(fetchTotalDownloads(multiPageFetch)).resolves.toEqual({
      etag: null,
      notModified: false,
      resolved: true,
      total: 1_025,
    });
    expect(multiPageFetch).toHaveBeenCalledTimes(2);
  });

  it("uses ETag conditional requests (304) and reuses the last known count on transient failure", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse([{ draft: false, assets: [{ download_count: 8_672 }] }], 200, {
          etag: 'W/"v1"',
        }),
      )
      .mockResolvedValueOnce({
        ok: false,
        status: 304,
        headers: new Headers(),
        json: async () => [],
      })
      .mockRejectedValueOnce(new Error("rate limited"))
      .mockRejectedValueOnce(new Error("rate limited"));
    vi.stubGlobal("fetch", fetchMock);

    const first = fakeResponse();
    await handler({}, first);

    expect(first.statusCode).toBe(200);
    expect(first.headers["content-type"]).toBe("image/svg+xml; charset=utf-8");
    expect(first.headers["cache-control"]).toBe(
      "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
    );
    expect(first.body).toContain("downloads: 8.7k");

    const notModifiedResponse = fakeResponse();
    await handler({ method: "GET" }, notModifiedResponse);

    expect(fetchMock.mock.calls[1][1].headers["if-none-match"]).toBe('W/"v1"');
    expect(notModifiedResponse.statusCode).toBe(200);
    expect(notModifiedResponse.headers["cache-control"]).toBe(
      "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
    );
    expect(notModifiedResponse.body).toContain("downloads: 8.7k");

    const fallbackGet = fakeResponse();
    await handler({ method: "GET" }, fallbackGet);

    expect(fallbackGet.statusCode).toBe(200);
    expect(fallbackGet.body).toContain("downloads: 8.7k");
    expect(fallbackGet.headers["cache-control"]).toContain(
      "stale-while-revalidate=86400",
    );

    const fallbackHead = fakeResponse();
    await handler({ method: "HEAD" }, fallbackHead);

    expect(fallbackHead.statusCode).toBe(200);
    expect(fallbackHead.body).toBe("");
    expect(fallbackHead.ended).toBe(true);
    expect(fallbackHead.headers["cache-control"]).toContain(
      "stale-while-revalidate=86400",
    );
  });

  it("renders a non-cached fallback SVG instead of a broken image on cold failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ message: "error" }, 503)),
    );

    const response = fakeResponse();
    await handler({}, response);

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toBe("image/svg+xml; charset=utf-8");
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(response.body).toContain("downloads: releases");
  });

  it("keeps /badge/(.*) headers after /(.*) in vercel.json so the SVG CSP wins", () => {
    const vercelConfig = JSON.parse(
      readFileSync(resolve(import.meta.dirname, "../vercel.json"), "utf8"),
    );

    expect(vercelConfig.rewrites).toContainEqual({
      source: "/badge/downloads",
      destination: "/api/downloads-badge",
    });

    const catchAllIndex = vercelConfig.headers.findIndex(
      (rule) => rule.source === "/(.*)",
    );
    const badgeIndex = vercelConfig.headers.findIndex(
      (rule) => rule.source === "/badge/(.*)",
    );
    expect(catchAllIndex).toBeGreaterThanOrEqual(0);
    expect(badgeIndex).toBeGreaterThan(catchAllIndex);
  });
});
