import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const tauriDir = resolve(import.meta.dirname);
const tauriConfig = JSON.parse(
  readFileSync(resolve(tauriDir, "tauri.conf.json"), "utf8"),
);
const libRs = readFileSync(resolve(tauriDir, "src", "lib.rs"), "utf8");

describe("desktop window chrome", () => {
  it("disables the native shadow on the transparent main window", () => {
    const mainWindow = tauriConfig.app.windows.find(
      (window) => window.label === "main",
    );

    expect(mainWindow).toBeDefined();
    expect(mainWindow.transparent).toBe(true);
    expect(mainWindow.shadow).toBe(false);
    expect(mainWindow.windowEffects).toBeUndefined();
  });

  it("uses left tray click to show the main window and right click for the menu", () => {
    expect(libRs).toContain(".show_menu_on_left_click(false)");
    expect(libRs).toContain("TrayIconEvent::Click");
    expect(libRs).toContain("MouseButton::Left");
    expect(libRs).toContain("MouseButtonState::Up");
    expect(libRs).toContain("show_window(&window)");
  });

  it("names the first tray action as opening the main window", () => {
    expect(libRs).toContain('.text("show", "打开主界面")');
  });

  it("defines a hidden companion window for the mini opacity slider", () => {
    const opacityWindow = tauriConfig.app.windows.find(
      (window) => window.label === "mini-opacity",
    );

    expect(opacityWindow).toBeDefined();
    expect(opacityWindow.visible).toBe(false);
    expect(opacityWindow.decorations).toBe(false);
    expect(opacityWindow.transparent).toBe(true);
    expect(opacityWindow.shadow).toBe(false);
    expect(opacityWindow.skipTaskbar).toBe(true);
  });

  it("keeps the mini opacity companion window compact", () => {
    const opacityWindow = tauriConfig.app.windows.find(
      (window) => window.label === "mini-opacity",
    );

    expect(opacityWindow.width).toBe(116);
    expect(opacityWindow.height).toBe(60);
  });
});
