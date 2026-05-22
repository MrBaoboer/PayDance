import { describe, expect, it } from "vitest";
import appSource from "./App.vue?raw";

describe("app chrome", () => {
  it("suppresses the unused webview context menu on full and mini windows", () => {
    expect(appSource).toContain("@contextmenu.prevent");
  });

  it("keeps sheets draggable while their interactive controls remain usable", () => {
    expect(appSource).toContain("@mousedown.left=\"startDrag\"");
    expect(appSource).toContain("@mousedown.left.stop");
    expect(appSource).toContain("settings-sheet__header");
  });

  it("uses a calmer, more opaque first-run panel backdrop", () => {
    expect(appSource).toContain("--onboarding-panel: rgb(255 255 255 / 0.98)");
    expect(appSource).toContain("--onboarding-panel: rgb(24 24 27 / 0.96)");
  });

  it("hosts the mini opacity panel in a separate lightweight window", () => {
    expect(appSource).toContain("MiniOpacityPanel");
    expect(appSource).toContain('appWindow.label === "mini-opacity"');
    expect(appSource).toContain("showMiniOpacityPanel");
    expect(appSource).toContain("event: MouseEvent");
    expect(appSource).toContain("resolvePointerMiniOpacityPanelPosition");
    expect(appSource).toContain("Failed to place mini opacity panel");
    expect(appSource).toContain("mini-opacity-panel-open");
    expect(appSource).toContain("mini-opacity-change");
    expect(appSource).toContain("commit?: boolean");
    expect(appSource).toContain("event.payload.commit === true");
  });

  it("persists mini opacity together with the mini window state", () => {
    expect(appSource).toContain("miniOpacityPercent");
    expect(appSource).toContain(":opacity-percent=\"miniOpacityPercent\"");
    expect(appSource).toContain("miniOpacityPercent: miniOpacityPercent.value");
  });

  it("keeps a final app-level fallback around settings loading", () => {
    expect(appSource).toContain("loadWindowPreferences");
    expect(appSource).toContain("catch (error)");
    expect(appSource).toContain("defaultWindowPreferences");
  });
});
