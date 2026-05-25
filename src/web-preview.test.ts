import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import appSource from "./App.vue?raw";
import webPreviewSource from "./WebPreviewApp.vue?raw";
import runtimeSource from "./platform/runtime.ts?raw";
import settingsStoreSource from "./platform/settings-store.ts?raw";

const read = (path: string) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const cssBlock = (selector: string) =>
  webPreviewSource.match(
    new RegExp(`${selector.split(".").join("\\.")} \\{[\\s\\S]*?\\n\\}`),
  )?.[0] ?? "";

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
    expect(webPreviewSource).toContain("把今天已经挣到的钱 实时放在桌面上");
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
    expect(webPreviewSource).toContain('class="web-preview__brand-icon"');
    expect(webPreviewSource).toContain('class="web-preview__version"');
    expect(webPreviewSource).toContain("--brand-logo-size: 62px");
    expect(webPreviewSource).toContain("--brand-name-size: 28px");
    expect(webPreviewSource).toContain("overflow: hidden");
    expect(webPreviewSource).toContain("clip-path: inset(7% round 15px)");
    expect(webPreviewSource).toContain("transform: scale(1.24)");
    expect(webPreviewSource).toContain("Web Preview");
    expect(cssBlock(".web-preview__version")).toContain("border-radius: 999px");
  });

  it("uses a more expressive web typography system", () => {
    expect(webPreviewSource).not.toContain("fonts.googleapis.com");
    expect(webPreviewSource).toContain('font-family: "PayDance Web Sans"');
    expect(webPreviewSource).toContain('font-family: "PayDance Web Serif"');
    expect(webPreviewSource).toContain(
      "noto-sans-sc-chinese-simplified-700-normal.woff2",
    );
    expect(webPreviewSource).toContain(
      "noto-serif-sc-chinese-simplified-900-normal.woff2",
    );
    expect(webPreviewSource).toContain("--web-font-display");
    expect(webPreviewSource).toContain("--web-font-ui");
    expect(webPreviewSource).toContain("--web-font-action");
    expect(webPreviewSource).toContain("PayDance Web Sans");
    expect(webPreviewSource).toContain("PayDance Web Serif");
    expect(webPreviewSource).toContain(".web-preview__copy");
    expect(webPreviewSource).toContain("font-family: var(--web-font-ui)");
    expect(cssBlock(".web-preview")).not.toContain("font-family:");
  });

  it("keeps the web headline as two designed lines instead of narrow vertical wrapping", () => {
    expect(webPreviewSource).toContain("width: min(100%, 640px)");
    expect(webPreviewSource).toContain("white-space: nowrap");
    expect(webPreviewSource).not.toContain("max-width: 7.6em");
  });

  it("keeps storefront actions stable and recognizable on hover", () => {
    expect(webPreviewSource).not.toContain("ExternalLink");
    expect(webPreviewSource).toContain("github-mark");
    expect(webPreviewSource).toContain("Download");
    expect(webPreviewSource).not.toContain("translateY(-1px)");
    expect(webPreviewSource).toContain(".web-preview__action--quiet {\n  gap: 5px;");
    expect(cssBlock(".web-preview__action")).toContain(
      "transition: box-shadow 160ms ease",
    );
    expect(cssBlock(".web-preview__action")).not.toContain("background-color 180ms ease");
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
    expect(webPreviewSource).toContain("--mini-panel-rgb: 255 255 255");
    expect(webPreviewSource).toContain("--mini-panel-rgb: 0 0 0");
    expect(webPreviewSource).not.toContain("--mini-stage-contrast");
    expect(webPreviewSource).not.toContain("--mini-stage-merge");
    expect(webPreviewSource).not.toContain("--mini-opacity-percent");
    expect(webPreviewSource).toContain("linear-gradient(145deg, rgb(229 230 233)");
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
    expect(readmeSource).toContain('<font size="7">');
    expect(readmeSource).toContain("看见每一秒的收入跳动");
    expect(readmeSource).toContain("完整桌面能力请使用 Windows 版");
    expect(readmeSource).toContain("下载 Windows 便携版");
    expect(readmeSource).not.toContain("Release</a>");
    expect(readmeSource).not.toContain("配置薪资与作息");
    expect(readmeSource).not.toContain("长期扫读");
    expect(readmeSource).not.toContain("Web Preview 是产品橱窗，不替代桌面版");
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
