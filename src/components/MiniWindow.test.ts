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
});
