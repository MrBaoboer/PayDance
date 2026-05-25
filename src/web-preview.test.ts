import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import appSource from "./App.vue?raw";
import webPreviewSource from "./WebPreviewApp.vue?raw";
import runtimeSource from "./platform/runtime.ts?raw";
import settingsStoreSource from "./platform/settings-store.ts?raw";

const read = (path: string) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

describe("PayDance Web Preview", () => {
  it("loads the web preview and desktop app from a runtime target selector", () => {
    expect(runtimeSource).toContain('import.meta.env.MODE === "web"');
    expect(appSource).toContain('import("./WebPreviewApp.vue")');
    expect(appSource).toContain('import("./DesktopApp.vue")');
  });

  it("keeps browser preview storage local and separate from Tauri Store", () => {
    expect(settingsStoreSource).toContain("createBrowserSettingsStore");
    expect(settingsStoreSource).toContain("window.localStorage");
    expect(settingsStoreSource).toContain("paydance-web-preview-settings");
    expect(settingsStoreSource).toContain('import("@tauri-apps/plugin-store")');
  });

  it("presents web preview as a bounded online experience", () => {
    expect(webPreviewSource).toContain("PayDance Web Preview");
    expect(webPreviewSource).toContain("每一秒，");
    expect(webPreviewSource).toContain("都在入账。");
    expect(webPreviewSource).toContain("下载 Windows 版");
    expect(webPreviewSource).not.toContain("开始体验");
    expect(webPreviewSource).toContain(':show-desktop-features="false"');
    expect(webPreviewSource).not.toContain("Web Preview 只用于预览核心体验");
    expect(webPreviewSource).not.toContain("@tauri-apps");
  });

  it("brands the web storefront with the product logo and current version", () => {
    expect(webPreviewSource).toContain("productLogoUrl");
    expect(webPreviewSource).toContain("appVersion");
    expect(webPreviewSource).toContain('class="web-preview__brand"');
    expect(webPreviewSource).toContain('class="web-preview__version"');
    expect(webPreviewSource).toContain("--brand-logo-size: 48px");
    expect(webPreviewSource).toContain("--brand-name-size: 22px");
  });

  it("removes auxiliary text around the software preview", () => {
    expect(webPreviewSource).not.toContain("web-preview__showcase-header");
    expect(webPreviewSource).not.toContain("web-preview__notice");
    expect(webPreviewSource).not.toContain("网页体验版");
  });

  it("adds a centered author attribution footer", () => {
    expect(webPreviewSource).toContain("appCopyright");
    expect(webPreviewSource).toContain('class="web-preview__footer"');
    expect(webPreviewSource).toContain(
      "{{ appCopyright }} · {{ appName }} {{ appEnglishName }}",
    );
  });

  it("uses a compact preview stage for mini floating mode", () => {
    expect(webPreviewSource).toContain("miniLayerStyle");
    expect(webPreviewSource).toContain("--mini-stage-width");
    expect(webPreviewSource).toContain("--mini-stage-height");
    expect(webPreviewSource).not.toContain(
      "width: min(100%, 480px);\n  height: 460px;\n  border-radius: 22px;\n  background: color-mix(in srgb, var(--panel) 86%, transparent);",
    );
  });

  it("keeps the dark preview window opaque instead of leaking the page background", () => {
    expect(webPreviewSource).toContain(".web-preview__frame :deep(.app-window)");
    expect(webPreviewSource).toContain("background: var(--panel)");
    expect(webPreviewSource).toContain("backdrop-filter: none");
  });

  it("keeps the web preview window close to the desktop default size", () => {
    expect(webPreviewSource).toContain("width: min(100%, 480px)");
    expect(webPreviewSource).toContain("height: 460px");
    expect(webPreviewSource).not.toContain("width: min(100%, 720px)");
  });

  it("keeps README focused without a separate recent updates section", () => {
    const readmeSource = read("README.md");

    expect(readmeSource).not.toContain("## 近期改进");
    expect(readmeSource).toContain("Web Preview");
    expect(readmeSource).toContain("下载 Windows 便携版");
  });

  it("builds the web preview for GitHub Pages", () => {
    expect(read("vite.config.ts")).toContain(
      'base: mode === "web" ? "/PayDance/" : "./"',
    );
    expect(read(".github/workflows/web-preview.yml")).toContain("npm run build:web");
    expect(read(".github/workflows/web-preview.yml")).toContain(
      "actions/upload-pages-artifact@v5",
    );
    expect(read(".github/workflows/web-preview.yml")).toContain(
      "actions/deploy-pages@v5",
    );
  });
});
