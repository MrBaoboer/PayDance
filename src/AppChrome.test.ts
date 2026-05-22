import { describe, expect, it } from "vitest";
import appSource from "./App.vue?raw";
import miniOpacityPanelSource from "./composables/useMiniOpacityPanel.ts?raw";
import windowLifecycleSource from "./composables/useAppWindowLifecycle.ts?raw";
import windowStatePersistenceSource from "./composables/useWindowStatePersistence.ts?raw";

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
    expect(appSource).toContain("useMiniOpacityPanel(");
    expect(miniOpacityPanelSource).toContain("anchor: MiniOpacityPanelAnchor");
    expect(miniOpacityPanelSource).toContain("PhysicalPosition");
    expect(miniOpacityPanelSource).toContain("LogicalSize");
    expect(miniOpacityPanelSource).toContain("currentMonitor");
    expect(miniOpacityPanelSource).toContain("appWindow.innerPosition()");
    expect(miniOpacityPanelSource).toContain("appWindow.innerSize()");
    expect(miniOpacityPanelSource).toContain("opacityWindow.innerSize()");
    expect(miniOpacityPanelSource).toContain("opacityWindow.innerPosition()");
    expect(miniOpacityPanelSource).toContain("opacityWindow.outerPosition()");
    expect(miniOpacityPanelSource).toContain("resolveMiniOpacityPanelWindowPosition");
    expect(miniOpacityPanelSource).toContain("resolveMiniOpacityPanelPhysicalSize");
    expect(miniOpacityPanelSource).toContain("resolveMiniOpacityPanelAnchorRect");
    expect(miniOpacityPanelSource).not.toContain("LogicalPosition");
    expect(miniOpacityPanelSource).not.toContain("resolveMiniOpacityPanelPlacement(event");
    expect(miniOpacityPanelSource).not.toContain("resolvePointerMiniOpacityPanelPosition");
    expect(miniOpacityPanelSource).toContain("mini-opacity-panel-open");
    expect(windowLifecycleSource).toContain("mini-opacity-change");
    expect(windowLifecycleSource).toContain("commit?: boolean");
    expect(windowLifecycleSource).toContain("event.payload.commit === true");
  });

  it("persists mini opacity together with the mini window state", () => {
    expect(appSource).toContain("miniOpacityPercent");
    expect(appSource).toContain(":opacity-percent=\"miniOpacityPercent\"");
    expect(windowStatePersistenceSource).toContain(
      "miniOpacityPercent: miniOpacityPercent.value",
    );
  });

  it("keeps a final app-level fallback around settings loading", () => {
    expect(appSource).toContain("loadWindowPreferences");
    expect(windowStatePersistenceSource).toContain("catch (error)");
    expect(windowStatePersistenceSource).toContain("defaultWindowPreferences");
  });
});
