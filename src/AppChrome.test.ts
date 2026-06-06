// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import desktopAppSource from "./DesktopApp.vue?raw";
import appWindowSource from "./components/AppWindow.vue?raw";
import miniOpacityPanelSource from "./composables/useMiniOpacityPanel.ts?raw";
import windowPositionRecoverySource from "./composables/useWindowPositionRecovery.ts?raw";
import windowLifecycleSource from "./composables/useAppWindowLifecycle.ts?raw";
import windowStatePersistenceSource from "./composables/useWindowStatePersistence.ts?raw";

const appThemeSource = readFileSync(
  new URL("./styles/app-theme.css", import.meta.url),
  "utf8",
);

describe("app chrome", () => {
  it("suppresses the unused webview context menu on full and mini windows", () => {
    expect(desktopAppSource).toContain("@contextmenu.prevent");
  });

  it("keeps sheets draggable while their interactive controls remain usable", () => {
    expect(appWindowSource).toContain("@mousedown.left=\"emit('dragStart', $event)\"");
    expect(appWindowSource).toContain("@mousedown.left.stop");
    expect(appWindowSource).toContain("settings-sheet__header");
  });

  it("uses a calmer, more opaque first-run panel backdrop", () => {
    expect(appThemeSource).toContain("--onboarding-panel: rgb(255 255 255 / 0.99)");
    expect(appThemeSource).toContain("--onboarding-panel: rgb(18 18 20 / 0.98)");
  });

  it("hosts the mini opacity panel in a separate lightweight window", () => {
    expect(desktopAppSource).toContain("MiniOpacityPanel");
    expect(desktopAppSource).toContain('appWindow.label === "mini-opacity"');
    expect(desktopAppSource).toContain("showMiniOpacityPanel");
    expect(desktopAppSource).toContain("useMiniOpacityPanel(");
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
    expect(miniOpacityPanelSource).not.toContain(
      "resolveMiniOpacityPanelPlacement(event",
    );
    expect(miniOpacityPanelSource).not.toContain(
      "resolvePointerMiniOpacityPanelPosition",
    );
    expect(miniOpacityPanelSource).toContain("mini-opacity-panel-open");
    expect(windowLifecycleSource).toContain("mini-opacity-change");
    expect(windowLifecycleSource).toContain("commit?: boolean");
    expect(windowLifecycleSource).toContain("event.payload.commit === true");
  });

  it("persists mini opacity together with the mini window state", () => {
    expect(desktopAppSource).toContain("miniOpacityPercent");
    expect(desktopAppSource).toContain(':opacity-percent="miniOpacityPercent"');
    expect(windowStatePersistenceSource).toContain(
      "miniOpacityPercent: miniOpacityPercent.value",
    );
  });

  it("keeps a final app-level fallback around settings loading", () => {
    expect(desktopAppSource).toContain("loadWindowPreferences");
    expect(windowStatePersistenceSource).toContain("catch (error)");
    expect(windowStatePersistenceSource).toContain("defaultWindowPreferences");
  });

  it("flushes pending state and exits from the frontend when tray quit is requested", () => {
    const exitListener = desktopAppSource.slice(
      desktopAppSource.indexOf('appWindow.listen("before-app-exit"'),
      desktopAppSource.indexOf(
        "await appWindow.onMoved",
        desktopAppSource.indexOf('appWindow.listen("before-app-exit"'),
      ),
    );

    expect(exitListener).toContain('await import("@tauri-apps/plugin-process")');
    expect(exitListener).toContain("await saveStateNow()");
    expect(exitListener).toContain("await exit(0)");
  });

  it("can restore a saved window position from the tray", () => {
    expect(desktopAppSource).toContain("useWindowPositionRecovery");
    expect(desktopAppSource).toContain("restoreWindowPosition");
    expect(windowPositionRecoverySource).toContain("availableMonitors");
    expect(windowPositionRecoverySource).toContain("resolveVisibleWindowPosition");
    expect(windowPositionRecoverySource).toContain("fallbackMainPosition");
    expect(windowPositionRecoverySource).toContain("PhysicalPosition");
    expect(windowPositionRecoverySource).toContain("miniPosition");
    expect(desktopAppSource).toContain("recordWindowPosition(position)");
  });
});
