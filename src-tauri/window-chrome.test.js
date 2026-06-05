// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const tauriDir = resolve(import.meta.dirname);
const tauriConfig = JSON.parse(
  readFileSync(resolve(tauriDir, "tauri.conf.json"), "utf8"),
);
const defaultCapability = JSON.parse(
  readFileSync(resolve(tauriDir, "capabilities", "default.json"), "utf8"),
);
const miniOpacityCapability = JSON.parse(
  readFileSync(resolve(tauriDir, "capabilities", "mini-opacity.json"), "utf8"),
);
const desktopCapability = JSON.parse(
  readFileSync(resolve(tauriDir, "capabilities", "desktop.json"), "utf8"),
);
const libRs = readFileSync(resolve(tauriDir, "src", "lib.rs"), "utf8");

describe("desktop window chrome", () => {
  it("disables the native shadow on the transparent main window", () => {
    const mainWindow = tauriConfig.app.windows.find((window) => window.label === "main");

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
    expect(libRs).toContain("打开主界面");
    expect(libRs).toContain('.text("show"');
  });

  it("hides immediately and delegates process exit when the tray quit action is selected", () => {
    const quitBranch = libRs.slice(
      libRs.indexOf('"quit" => {'),
      libRs.indexOf("_ => {}", libRs.indexOf('"quit" => {')),
    );

    expect(quitBranch).toContain("window.hide()");
    expect(quitBranch).toContain('window.emit("before-app-exit", ())');
    expect(quitBranch).not.toContain("std::thread::sleep");
    expect(quitBranch).not.toContain("Duration::from_secs");
    expect(quitBranch).not.toContain("std::thread::spawn");
    expect(quitBranch).not.toContain("handle.exit(0)");
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

    expect(opacityWindow.width).toBe(108);
    expect(opacityWindow.height).toBe(52);
  });

  it("keeps native geometry and store permissions on the main window only", () => {
    expect(defaultCapability.windows).toEqual(["main"]);
    expect(defaultCapability.permissions).toContain("core:window:allow-inner-position");
    expect(defaultCapability.permissions).toContain("core:window:allow-inner-size");
    expect(defaultCapability.permissions).toContain("core:window:allow-outer-position");
    expect(defaultCapability.permissions).toContain("core:window:allow-outer-size");
    expect(defaultCapability.permissions).toContain("core:window:allow-current-monitor");
    expect(defaultCapability.permissions).toContain("core:window:allow-set-position");
    expect(defaultCapability.permissions).toContain("store:allow-get");
    expect(JSON.stringify(defaultCapability.permissions)).toContain(
      "opener:allow-open-url",
    );
  });

  it("allows the frontend to exit immediately after flushing tray quit state", () => {
    expect(desktopCapability.windows).toEqual(["main"]);
    expect(desktopCapability.permissions).toContain("process:allow-exit");
    expect(desktopCapability.permissions).toContain("process:allow-restart");
  });

  it("uses a portable updater command for in-place exe replacement", () => {
    expect(libRs).toContain("install_portable_update");
    expect(libRs).toContain("tauri_plugin_updater::UpdaterExt");
    expect(libRs).toContain(".download(|_, _| {}, || {})");
    expect(libRs).toContain("apply-update.ps1");
    expect(libRs).toContain(
      "Copy-Item -LiteralPath $Source -Destination $Destination -Force",
    );
    expect(defaultCapability.permissions).toContain("updater:allow-check");
    expect(defaultCapability.permissions).not.toContain(
      "updater:allow-download-and-install",
    );
    expect(libRs).not.toContain("ShellExecuteW");
    expect(libRs).not.toContain("/UPDATE");
  });

  it("limits the mini opacity companion window to slider-only permissions", () => {
    expect(miniOpacityCapability.windows).toEqual(["mini-opacity"]);
    expect(miniOpacityCapability.permissions).toEqual([
      "core:event:allow-emit-to",
      "core:event:allow-listen",
      "core:event:allow-unlisten",
      "core:window:allow-hide",
    ]);
    expect(miniOpacityCapability.permissions).not.toContain("store:allow-get");
    expect(JSON.stringify(miniOpacityCapability.permissions)).not.toContain(
      "opener:allow-open-url",
    );
    expect(miniOpacityCapability.permissions).not.toContain(
      "core:window:allow-set-position",
    );
  });
});
