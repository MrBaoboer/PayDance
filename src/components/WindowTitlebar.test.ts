// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { describe, expect, it } from "vitest";
import windowTitlebarSource from "./WindowTitlebar.vue?raw";

describe("window titlebar", () => {
  it("keeps the status chip visually centered with the window action buttons", () => {
    expect(windowTitlebarSource).toContain(".status-chip");
    expect(windowTitlebarSource).toContain("height: clamp(30px, 7.2cqw, 36px)");
    expect(windowTitlebarSource).toContain("line-height: 1");
    expect(windowTitlebarSource).toContain(".status-chip span:last-child");
  });

  it("moves the titlebar controls inward and down after removing the outer gutter", () => {
    expect(windowTitlebarSource).toContain("height: clamp(62px, 14cqh, 74px)");
    expect(windowTitlebarSource).toContain("align-items: flex-start");
    expect(windowTitlebarSource).toContain(
      "padding: clamp(14px, 3.2cqh, 18px) clamp(22px, 5.2cqw, 32px) 0",
    );
  });
});
