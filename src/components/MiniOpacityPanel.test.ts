import { describe, expect, it } from "vitest";
import miniOpacityPanelSource from "./MiniOpacityPanel.vue?raw";

describe("mini opacity panel", () => {
  it("uses a compact slider from 10 to 100 percent", () => {
    expect(miniOpacityPanelSource).toContain('type="range"');
    expect(miniOpacityPanelSource).toContain(":min=\"minMiniOpacityPercent\"");
    expect(miniOpacityPanelSource).toContain(":max=\"maxMiniOpacityPercent\"");
    expect(miniOpacityPanelSource).toContain('aria-label="迷你悬浮透明度"');
  });

  it("receives open events and emits opacity changes back to the main window", () => {
    expect(miniOpacityPanelSource).toContain("mini-opacity-panel-open");
    expect(miniOpacityPanelSource).toContain("mini-opacity-change");
    expect(miniOpacityPanelSource).toContain('emitTo("main"');
    expect(miniOpacityPanelSource).toContain("commit");
    expect(miniOpacityPanelSource).toContain('@change="updateOpacity($event, true)"');
  });

  it("uses theme classes without changing the mini window surface itself", () => {
    expect(miniOpacityPanelSource).toContain("theme-light");
    expect(miniOpacityPanelSource).toContain("theme-dark");
    expect(miniOpacityPanelSource).not.toContain("RollingAmount");
  });

  it("uses a tiny polished popover instead of a rigid large capsule", () => {
    expect(miniOpacityPanelSource).toContain("border-radius: 14px");
    expect(miniOpacityPanelSource).toContain("height: 100%");
    expect(miniOpacityPanelSource).toContain("gap: 5px");
    expect(miniOpacityPanelSource).toContain("height: 2px");
    expect(miniOpacityPanelSource).toContain("width: 8px");
    expect(miniOpacityPanelSource).toContain("height: 8px");
    expect(miniOpacityPanelSource).toContain("::-webkit-slider-thumb");
    expect(miniOpacityPanelSource).toContain("--slider-progress");
    expect(miniOpacityPanelSource).not.toContain("height: 100vh");
    expect(miniOpacityPanelSource).not.toContain("padding: 8px 12px 9px");
    expect(miniOpacityPanelSource).not.toContain("gap: 12px");
    expect(miniOpacityPanelSource).not.toContain("padding: 14px");
    expect(miniOpacityPanelSource).not.toContain("drop-shadow");
  });
});
