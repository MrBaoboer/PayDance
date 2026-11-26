// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { describe, expect, it } from "vitest";
import miniWindowSource from "./MiniWindow.vue?raw";

describe("mini window", () => {
  it("keeps the compact v0.6.9 single-surface structure", () => {
    expect(miniWindowSource).toContain('class="mini-window"');
    expect(miniWindowSource).not.toContain("mini-shell");
    expect(miniWindowSource).not.toContain("mini-surface");
    expect(miniWindowSource).not.toContain("mini-amount");
  });

  it("uses a restrained desktop shadow token without the legacy heavy glow", () => {
    expect(miniWindowSource).toContain("box-shadow: var(--mini-window-shadow, none)");
    expect(miniWindowSource).toContain("<ResizeHandles");
    expect(miniWindowSource).toContain('size="compact"');
    expect(miniWindowSource).not.toContain("0 16px 42px");
  });

  it("changes only the capsule background alpha instead of fading the whole window", () => {
    expect(miniWindowSource).toContain("opacityPercent");
    expect(miniWindowSource).toContain("--mini-panel-opacity");
    expect(miniWindowSource).toContain("--mini-panel-rgb");
    expect(miniWindowSource).not.toMatch(/\n\s*opacity:/);
  });

  it("supports a frameless 0% pure-text floating mode with hover outline", () => {
    expect(miniWindowSource).toContain("is-transparent");
    expect(miniWindowSource).toContain("--mini-transparent-text-shadow");
    expect(miniWindowSource).toContain("--mini-transparent-hover-border");
  });

  it("opens the mini opacity panel from a custom right click gesture", () => {
    expect(miniWindowSource).toContain("@contextmenu.prevent.stop");
    expect(miniWindowSource).toContain("opacityMenu");
  });
});
