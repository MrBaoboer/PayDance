// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { describe, expect, it, vi } from "vitest";
import handler, {
  releasesPageUrl,
  resolveLatestTag,
  resolveWindowsDownload,
  windowsAssetUrl,
} from "./download-windows.js";

const redirectTo = (location) => ({
  status: 302,
  headers: new Headers(location ? { location } : {}),
});

const fakeResponse = () => {
  const headers = {};
  return {
    headers,
    statusCode: 200,
    ended: false,
    setHeader(name, value) {
      headers[name.toLowerCase()] = value;
    },
    end() {
      this.ended = true;
    },
  };
};

describe("site download endpoint", () => {
  it("reads the newest tag from GitHub's releases/latest redirect", () => {
    expect(
      resolveLatestTag("https://github.com/MrBaoboer/PayDance/releases/tag/v0.9.10"),
    ).toBe("v0.9.10");
    expect(resolveLatestTag("/MrBaoboer/PayDance/releases/tag/v1.0.0-rc.1")).toBe(
      "v1.0.0-rc.1",
    );
  });

  it("ignores redirects that are not a release tag of this repository", () => {
    expect(resolveLatestTag(null)).toBeNull();
    expect(resolveLatestTag("")).toBeNull();
    expect(resolveLatestTag("https://github.com/MrBaoboer/PayDance/releases")).toBeNull();
    expect(
      resolveLatestTag("https://github.com/someone/else/releases/tag/v0.9.10"),
    ).toBeNull();
    expect(
      resolveLatestTag("https://github.com/MrBaoboer/PayDance/releases/tag/main"),
    ).toBeNull();
    expect(
      resolveLatestTag("https://github.com/MrBaoboer/PayDance/releases/tag/v0.9.10/../x"),
    ).toBeNull();
    expect(resolveLatestTag("not a url at all ://")).toBeNull();
  });

  it("builds the versioned asset URL that the release workflow uploads", () => {
    expect(windowsAssetUrl("v0.9.10")).toBe(
      "https://github.com/MrBaoboer/PayDance/releases/download/v0.9.10/pay-dance-v0.9.10-windows-x64.exe",
    );
  });

  it("redirects to the newest versioned EXE when GitHub answers", async () => {
    const fetchImpl = vi.fn(async () =>
      redirectTo("https://github.com/MrBaoboer/PayDance/releases/tag/v0.9.10"),
    );

    await expect(resolveWindowsDownload(fetchImpl)).resolves.toEqual({
      url: windowsAssetUrl("v0.9.10"),
      resolved: true,
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      releasesPageUrl,
      expect.objectContaining({ redirect: "manual" }),
    );
    expect(fetchImpl.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });

  it("falls back to the Release page when the tag cannot be resolved", async () => {
    await expect(
      resolveWindowsDownload(async () => redirectTo(undefined)),
    ).resolves.toEqual({
      url: releasesPageUrl,
      resolved: false,
    });
    await expect(
      resolveWindowsDownload(async () => {
        throw new Error("network down");
      }),
    ).resolves.toEqual({ url: releasesPageUrl, resolved: false });
  });

  it("answers with a cacheable 302 to the resolved asset", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        redirectTo("https://github.com/MrBaoboer/PayDance/releases/tag/v0.9.10"),
      ),
    );
    try {
      const response = fakeResponse();
      await handler({}, response);

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe(windowsAssetUrl("v0.9.10"));
      expect(response.headers["cache-control"]).toBe(
        "public, s-maxage=300, stale-while-revalidate=600",
      );
      expect(response.ended).toBe(true);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("does not cache the fallback redirect", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    try {
      const response = fakeResponse();
      await handler({}, response);

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe(releasesPageUrl);
      expect(response.headers["cache-control"]).toBe("no-store");
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
