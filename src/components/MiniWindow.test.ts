import { describe, expect, it } from "vitest";
import miniWindowSource from "./MiniWindow.vue?raw";

describe("mini window", () => {
  it("keeps the compact v0.6.9 single-surface structure", () => {
    expect(miniWindowSource).toContain('class="mini-window"');
    expect(miniWindowSource).not.toContain("mini-shell");
    expect(miniWindowSource).not.toContain("mini-surface");
    expect(miniWindowSource).not.toContain("mini-amount");
  });

  it("removes the decorative outer shadow without changing the capsule surface", () => {
    expect(miniWindowSource).toContain("box-shadow: none");
    expect(miniWindowSource).not.toContain("0 16px 42px");
  });

  it("changes only the capsule background alpha instead of fading the whole window", () => {
    expect(miniWindowSource).toContain("opacityPercent");
    expect(miniWindowSource).toContain("--mini-panel-opacity");
    expect(miniWindowSource).toContain("--mini-panel-rgb");
    expect(miniWindowSource).not.toMatch(/\n\s*opacity:/);
  });

  it("opens the mini opacity panel from a custom right click gesture", () => {
    expect(miniWindowSource).toContain("@contextmenu.prevent.stop");
    expect(miniWindowSource).toContain("opacityMenu");
  });
});
