// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { describe, expect, it } from "vitest";
import { localeUrl, resolveWebLocale } from "./locale-routing";

describe("web preview locale routing", () => {
  it("resolves the canonical root and English entry paths", () => {
    expect(resolveWebLocale("/PayDance/", "/PayDance/")).toBe("zh-CN");
    expect(resolveWebLocale("/PayDance/index.html", "/PayDance/")).toBe("zh-CN");
    expect(resolveWebLocale("/PayDance/en/", "/PayDance/")).toBe("en");
    expect(resolveWebLocale("/PayDance/en/index.html", "/PayDance/")).toBe("en");
  });

  it("builds canonical locale URLs from the Vite base URL", () => {
    expect(localeUrl("zh-CN", "/PayDance/")).toBe("/PayDance/");
    expect(localeUrl("en", "/PayDance/")).toBe("/PayDance/en/");
    expect(localeUrl("en", "/")).toBe("/en/");
  });
});
