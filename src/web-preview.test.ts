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
    expect(webPreviewSource).toContain('class="web-preview__headline-main"');
    expect(webPreviewSource).toContain("看见每一秒的");
    expect(webPreviewSource).toContain('class="web-preview__headline-accent"');
    expect(webPreviewSource).toContain("收入跳动");
    expect(webPreviewSource).toContain("把今天已经挣到的钱");
    expect(webPreviewSource).toContain("实时放在桌面上");
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
    expect(webPreviewSource).toContain("--brand-logo-size: 58px");
    expect(webPreviewSource).toContain("--brand-name-size: 26px");
  });

  it("uses a more expressive web typography system", () => {
    expect(webPreviewSource).toContain("--web-font-display");
    expect(webPreviewSource).toContain("--web-font-ui");
    expect(webPreviewSource).toContain("--web-font-action");
    expect(webPreviewSource).toContain("Alibaba PuHuiTi 3.0");
    expect(webPreviewSource).toContain("HarmonyOS Sans SC");
    expect(webPreviewSource).toContain("MiSans");
  });

  it("keeps storefront actions stable and recognizable on hover", () => {
    expect(webPreviewSource).not.toContain("ExternalLink");
    expect(webPreviewSource).toContain("github-mark");
    expect(webPreviewSource).toContain("Download");
    expect(webPreviewSource).not.toContain("translateY(-1px)");
    expect(webPreviewSource).toContain(".web-preview__action--primary:hover");
    expect(webPreviewSource).toContain(".web-preview__action--quiet:hover");
  });

  it("uses compact feature tags with short descriptions", () => {
    expect(webPreviewSource).toContain('class="web-preview__chips"');
    expect(webPreviewSource).toContain('class="web-preview__chip"');
    expect(webPreviewSource).toContain("秒秒入账");
    expect(webPreviewSource).toContain("角落常驻");
    expect(webPreviewSource).toContain("隐私安心");
    expect(webPreviewSource).toContain("无账号，无遥测");
    expect(webPreviewSource).toContain("text-align: center");
    expect(webPreviewSource).not.toContain("本地保存");
    expect(webPreviewSource).not.toContain("金额随工作时间增长");
    expect(webPreviewSource).toContain("无账号，无遥测");
  });

  it("removes auxiliary text around the software preview", () => {
    expect(webPreviewSource).not.toContain("web-preview__showcase-header");
    expect(webPreviewSource).not.toContain("web-preview__notice");
    expect(webPreviewSource).not.toContain("网页体验版");
  });

  it("adds a centered author attribution footer", () => {
    expect(webPreviewSource).toContain("appCopyright");
    expect(webPreviewSource).toContain('class="web-preview__footer"');
    expect(webPreviewSource).toContain('class="web-preview__footer-mark"');
  });

  it("uses a compact preview stage for mini floating mode", () => {
    expect(webPreviewSource).toContain("miniLayerStyle");
    expect(webPreviewSource).toContain("--mini-stage-width");
    expect(webPreviewSource).toContain("--mini-stage-height");
    expect(webPreviewSource).toContain(".web-preview__mini-window.theme-light");
    expect(webPreviewSource).toContain(".web-preview__mini-window.theme-dark");
    expect(webPreviewSource).toContain("--mini-panel-rgb: 18 18 20");
    expect(webPreviewSource).toContain("--mini-panel-rgb: 250 250 251");
    expect(webPreviewSource).toContain("--mini-preview-corner: 14px");
    expect(webPreviewSource).toContain(
      "clip-path: inset(0 round var(--mini-preview-corner))",
    );
    expect(webPreviewSource).toContain("backdrop-filter: none");
    expect(webPreviewSource).not.toContain(
      "width: min(100%, 480px);\n  height: 460px;\n  border-radius: 22px;\n  background: color-mix(in srgb, var(--panel) 86%, transparent);",
    );
  });

  it("separates the dark web stage from the dark software preview", () => {
    expect(webPreviewSource).toContain("--web-stage-panel");
    expect(webPreviewSource).toContain("--web-stage-ring");
    expect(webPreviewSource).toContain("--web-stage-glow");
    expect(webPreviewSource).toContain(".theme-dark.web-preview .web-preview__frame");
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
