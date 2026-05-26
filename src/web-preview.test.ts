import { readFileSync, statSync } from "node:fs";
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
    expect(webPreviewSource).toContain("具象化你的劳动价值");
    expect(webPreviewSource).toContain("专注工作，也看见回报");
    expect(webPreviewSource).toContain("下载 Windows 版");
    expect(webPreviewSource).toContain(
      "https://github.com/MasterBao66/PayDance/releases/latest/download/pay-dance.exe",
    );
    expect(webPreviewSource).not.toContain("开始体验");
    expect(webPreviewSource).toContain(':show-desktop-features="false"');
    expect(webPreviewSource).not.toContain("Web Preview 只用于预览核心体验");
    expect(webPreviewSource).not.toContain("@tauri-apps");
  });

  it("brands the web storefront with the product logo and current version", () => {
    expect(webPreviewSource).toContain("productLogoUrl");
    expect(webPreviewSource).toContain("appVersion");
    expect(webPreviewSource).toContain('class="web-preview__brand"');
    expect(webPreviewSource).toContain('class="web-preview__brand-logo"');
    expect(webPreviewSource).not.toContain("web-preview__brand-icon");
    expect(webPreviewSource).toContain('class="web-preview__version"');
    expect(webPreviewSource).toContain("Web Preview");
    expect(webPreviewSource).toContain('class="web-preview__version-dot"');
    expect(webPreviewSource).toContain("--brand-logo-size: 52px");
    expect(webPreviewSource).toContain("--brand-name-size: 24px");
    expect(webPreviewSource).not.toContain(".web-preview__brand-icon");
    expect(webPreviewSource).not.toContain("clip-path: inset(7% round 15px)");
    expect(webPreviewSource).not.toContain("transform: scale(1.24)");
    expect(webPreviewSource).not.toContain("<strong>v{{ appVersion }}</strong>");
    expect(webPreviewSource).toContain("<strong>{{ appVersion }}</strong>");
    expect(cssBlock(".web-preview__version")).not.toContain("border-radius: 999px");
    expect(cssBlock(".web-preview__version")).not.toContain("background:");
    expect(cssBlock(".web-preview__version")).not.toContain("box-shadow:");
  });

  it("uses a more expressive web typography system", () => {
    expect(webPreviewSource).not.toContain("fonts.googleapis.com");
    expect(webPreviewSource).not.toContain("@fontsource");
    expect(webPreviewSource).toContain('font-family: "PayDance Web Sans"');
    expect(webPreviewSource).toContain('font-family: "PayDance Web Serif"');
    expect(webPreviewSource).toContain("paydance-web-sans-subset.woff2");
    expect(webPreviewSource).toContain("paydance-web-serif-subset.woff2");
    expect(webPreviewSource).toContain("--web-font-display");
    expect(webPreviewSource).toContain("--web-font-ui");
    expect(webPreviewSource).toContain("--web-font-action");
    expect(webPreviewSource).toContain("PayDance Web Sans");
    expect(webPreviewSource).toContain("PayDance Web Serif");
    expect(webPreviewSource).toContain(".web-preview__copy");
    expect(webPreviewSource).toContain("font-family: var(--web-font-ui)");
    expect(cssBlock(".web-preview")).not.toContain("font-family:");
  });

  it("keeps bundled Chinese web fonts subsetted for the actual storefront copy", () => {
    const sansFont = statSync(
      new URL("./assets/fonts/paydance-web-sans-subset.woff2", import.meta.url),
    );
    const serifFont = statSync(
      new URL("./assets/fonts/paydance-web-serif-subset.woff2", import.meta.url),
    );

    expect(sansFont.size).toBeLessThan(80_000);
    expect(serifFont.size).toBeLessThan(105_000);
  });

  it("keeps the web headline as two designed lines instead of narrow vertical wrapping", () => {
    expect(webPreviewSource).toContain(
      "width: min(100%, calc(var(--headline-accent-size) * 5.2))",
    );
    expect(webPreviewSource).toContain("--headline-accent-size");
    expect(webPreviewSource).toContain("font-size: var(--headline-accent-size)");
    expect(webPreviewSource).not.toContain(
      "font-size: calc(var(--headline-main-size) * 1.5)",
    );
    expect(webPreviewSource).toContain("white-space: nowrap");
    expect(webPreviewSource).not.toContain("max-width: 7.6em");
  });

  it("keeps the web hero roomy while preserving the software preview on narrower windows", () => {
    expect(cssBlock(".web-preview")).toContain("--web-max-width: 1280px");
    expect(cssBlock(".web-preview__topbar")).toContain(
      "width: min(100%, var(--web-max-width))",
    );
    expect(cssBlock(".web-preview__hero")).toContain(
      "grid-template-columns: minmax(420px, 520px) minmax(430px, 500px)",
    );
    expect(cssBlock(".web-preview__hero")).toContain(
      "column-gap: clamp(42px, 5vw, 76px)",
    );
    expect(cssBlock(".web-preview__copy")).toContain("gap: clamp(18px, 2.1vw, 28px)");
    expect(webPreviewSource).toContain("@media (max-width: 1120px)");
    expect(webPreviewSource).toContain(
      "grid-template-columns: minmax(350px, 0.9fr) minmax(390px, 460px)",
    );
    expect(webPreviewSource).toContain("@media (max-width: 820px)");
  });

  it("uses the approved single-line lead without changing the hero structure", () => {
    expect(webPreviewSource).toContain("具象化你的劳动价值，专注工作，也看见回报");
    expect(webPreviewSource).not.toContain('class="web-preview__lead-line"');
    expect(webPreviewSource).not.toContain(
      ["<span>把今天", "已经挣到的钱</span>"].join(""),
    );
    expect(cssBlock(".web-preview__lead")).toContain("margin: 2px 0 0");
    expect(cssBlock(".web-preview__lead")).toContain("display: block");
    expect(cssBlock(".web-preview__lead")).not.toContain("gap:");
  });

  it("keeps storefront actions stable and recognizable on hover", () => {
    expect(webPreviewSource).not.toContain("ExternalLink");
    expect(webPreviewSource).toContain("github-mark");
    expect(webPreviewSource).toContain("Download");
    expect(webPreviewSource).toContain("Windows11Mark");
    expect(webPreviewSource).toContain('class="web-preview__action-label"');
    expect(cssBlock(".web-preview__action-label")).toContain(
      "transform: translateY(-0.75px)",
    );
    expect(webPreviewSource).toContain(".web-preview__action--quiet {\n  gap: 3px;");
    expect(cssBlock(".web-preview__action")).toContain(
      "transition: box-shadow 160ms ease",
    );
    expect(cssBlock(".web-preview__action")).toContain("align-items: center");
    expect(cssBlock(".web-preview__action")).toContain("line-height: 1");
    expect(cssBlock(".web-preview__action")).toContain("vertical-align: middle");
    expect(cssBlock(".windows11-mark")).toContain("display: block");
    expect(cssBlock(".github-mark")).toContain("display: block");
    expect(webPreviewSource).toContain(".web-preview__action :deep(svg)");
    expect(cssBlock(".web-preview__action")).not.toContain("background-color 180ms ease");
    expect(webPreviewSource).toContain(".web-preview__action--primary:hover");
    expect(webPreviewSource).toContain(".web-preview__action--quiet:hover");
  });

  it("uses compact feature tags with short descriptions", () => {
    expect(webPreviewSource).toContain('class="web-preview__feature-strip"');
    expect(webPreviewSource).toContain('class="web-preview__chips"');
    expect(webPreviewSource).toContain('class="web-preview__chip"');
    expect(webPreviewSource).toContain("Zap");
    expect(webPreviewSource).toContain("Focus");
    expect(webPreviewSource).toContain("ShieldCheck");
    expect(webPreviewSource).toContain("毫秒级更新");
    expect(webPreviewSource).toContain("今日收入实时跳动");
    expect(webPreviewSource).toContain("安心专注");
    expect(webPreviewSource).toContain("轻量窗口，静默运行");
    expect(webPreviewSource).toContain("隐私优先");
    expect(webPreviewSource).toContain("所有数据本地处理");
    expect(webPreviewSource).toContain('class="web-preview__chip-icon"');
    expect(webPreviewSource).toContain('class="web-preview__chip-copy"');
    expect(webPreviewSource.indexOf("毫秒级更新")).toBeLessThan(
      webPreviewSource.indexOf("安心专注"),
    );
    expect(webPreviewSource.indexOf("安心专注")).toBeLessThan(
      webPreviewSource.indexOf("隐私优先"),
    );
    expect(cssBlock(".web-preview__feature-strip")).toContain("grid-column: 1 / -1");
    expect(cssBlock(".web-preview__chip")).toContain("grid-template-columns");
    expect(cssBlock(".web-preview__chip")).toContain("text-align: left");
    expect(cssBlock(".web-preview__chip")).not.toContain("border:");
    expect(cssBlock(".web-preview__chip")).not.toContain("background:");
    expect(webPreviewSource).not.toContain("秒秒入账");
    expect(webPreviewSource).not.toContain("角落常驻");
    expect(webPreviewSource).not.toContain("隐私安心");
    expect(webPreviewSource).not.toContain("本地保存");
    expect(webPreviewSource).not.toContain("金额随工作时间增长");
    expect(webPreviewSource).not.toContain("无账号，无遥测");
  });

  it("keeps the three feature tags in one row by scaling instead of wrapping", () => {
    const featureStripBlock = cssBlock(".web-preview__feature-strip");
    const chipsBlock = cssBlock(".web-preview__chips");
    const chipBlock = cssBlock(".web-preview__chip");

    expect(featureStripBlock).toContain("width: 100%");
    expect(chipsBlock).toContain("grid-template-columns: repeat(");
    expect(chipsBlock).toContain(
      "calc(var(--web-chip-base-width) * var(--web-chip-scale))",
    );
    expect(chipsBlock).toContain("--web-chip-scale");
    expect(chipsBlock).not.toContain("flex-wrap");
    expect(chipBlock).toContain(
      "width: calc(var(--web-chip-base-width) * var(--web-chip-scale))",
    );
    expect(chipBlock).toContain("align-items: center");
    expect(cssBlock(".web-preview__chips dd")).toContain("white-space: nowrap");
    expect(webPreviewSource).toContain("@media (max-width: 560px)");
    expect(webPreviewSource).toContain(
      "--web-chip-scale: min(0.78, calc((100vw - 32px) / 564px));",
    );
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
    expect(webPreviewSource).toContain("linear-gradient(145deg, rgb(233 234 237)");
    expect(webPreviewSource).toContain("linear-gradient(145deg, rgb(39 40 45)");
    expect(webPreviewSource).toContain(".web-preview__showcase.is-mini::before");
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

  it("stabilizes the preview frame edge during theme switching", () => {
    const frameBlock = cssBlock(".web-preview__frame");

    expect(frameBlock).toContain("border: 0");
    expect(frameBlock).toContain("background-clip: padding-box");
    expect(frameBlock).toContain("contain: paint");
    expect(frameBlock).toContain("inset 0 0 0 1px var(--web-stage-ring)");
    expect(webPreviewSource).toContain(".web-preview__frame.is-theme-syncing");
    expect(webPreviewSource).not.toContain("border: 1px solid var(--web-stage-ring)");
    expect(cssBlock(".theme-dark.web-preview")).toContain(
      "--web-stage-ring: rgb(255 255 255 / 0.08)",
    );
  });

  it("keeps the web preview window close to the desktop default size", () => {
    expect(cssBlock(".web-preview__showcase")).toContain("width: min(100%, 480px)");
    expect(webPreviewSource).toContain("width: min(100%, 480px)");
    expect(webPreviewSource).toContain("height: 460px");
    expect(webPreviewSource).not.toContain("width: min(100%, 720px)");
  });

  it("keeps README focused without a separate recent updates section", () => {
    const readmeSource = read("README.md");

    expect(readmeSource).not.toContain("## 近期改进");
    expect(readmeSource).toContain('<font size="7">');
    expect(readmeSource).toContain("桌面实时工资看板");
    expect(readmeSource).not.toContain(String.fromCodePoint(0x4eea, 0x8868, 0x76d8));
    expect(readmeSource).toContain(">在线体验</");
    expect(readmeSource).toContain(">Windows 11 桌面端</");
    expect(readmeSource).not.toContain("shields.io");
    expect(readmeSource).not.toContain("优化完善在线体验");
    expect(readmeSource).not.toContain("下载 Windows 便携版");
    expect(readmeSource).toContain("Mr.Baoboer");
    for (const heading of [
      "## 产品简介",
      "## 界面体验",
      "## 核心特性",
      "## 快速下载",
      "## 技术架构",
      "## 开发者指南",
      "## 隐私声明",
      "## 作者与许可",
    ]) {
      expect(readmeSource).toContain(heading);
    }
    expect(readmeSource).not.toContain("## 产品简介与核心体验");
    expect(readmeSource).not.toContain("## 快速下载与安全校验");
    expect(readmeSource).not.toContain("## 技术架构与工程质量");
    expect(readmeSource).not.toContain("## 隐私声明、作者与许可");
    expect(readmeSource).toContain("| 在线体验 | [PayDance Web]");
    expect(readmeSource).toContain("网页端，含所有核心功能");
    expect(readmeSource).toContain("| Windows 11 桌面端 | [pay-dance.exe]");
    expect(readmeSource).toContain(
      "含开机自启动、窗口置顶、迷你悬浮模式、系统托盘等完整功能",
    );
    expect(readmeSource).not.toContain(["产品", "预览"].join(""));
    expect(readmeSource).not.toContain("poster-01-live-dashboard-v3.png");
    expect(readmeSource).not.toContain(["实时", "收入看板"].join(""));
    expect(readmeSource).not.toContain("GitHub Release | [最新正式版]");
    expect(readmeSource).not.toContain("源码           |");
    expect(readmeSource).not.toContain(["工程", "治理"].join(""));
    expect(readmeSource).not.toContain(
      ["把今天", "已经挣到的钱，实时放在桌面上"].join(""),
    );
    expect(readmeSource).not.toContain(["先在线", "感受核心界面"].join(""));
    expect(readmeSource).not.toContain(["Mr", "Ba" + "ober"].join("."));
    expect(readmeSource).not.toContain("actions/workflows/ci.yml/badge.svg");
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
