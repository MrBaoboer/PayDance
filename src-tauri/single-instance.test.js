import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const tauriDir = resolve(import.meta.dirname);
const cargoToml = readFileSync(resolve(tauriDir, "Cargo.toml"), "utf8");
const libRs = readFileSync(resolve(tauriDir, "src", "lib.rs"), "utf8");

describe("tauri single instance", () => {
  it("registers the official single-instance plugin on desktop", () => {
    expect(cargoToml).toContain("tauri-plugin-single-instance");
    expect(libRs).toContain("tauri_plugin_single_instance::init");
  });

  it("focuses the existing main window instead of opening a second app", () => {
    expect(libRs).toContain('get_webview_window("main")');
    expect(libRs).toContain("show_window(&window)");
  });
});
