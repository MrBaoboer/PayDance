// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md
// @vitest-environment happy-dom

import { beforeEach, describe, expect, it } from "vitest";
import { readBrowserThemeMode } from "./settings-store.web";

describe("browser settings store", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("reads the saved theme synchronously for the first web paint", () => {
    window.localStorage.setItem(
      "paydance-web-preview-settings",
      JSON.stringify({ themeMode: "dark" }),
    );

    expect(readBrowserThemeMode()).toBe("dark");
  });

  it("falls back to light when the saved theme is missing or invalid", () => {
    expect(readBrowserThemeMode()).toBe("light");

    window.localStorage.setItem(
      "paydance-web-preview-settings",
      JSON.stringify({ themeMode: "sepia" }),
    );
    expect(readBrowserThemeMode()).toBe("light");

    window.localStorage.setItem("paydance-web-preview-settings", "{broken");
    expect(readBrowserThemeMode()).toBe("light");
  });
});
