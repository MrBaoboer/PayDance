// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /ADDITIONAL_TERMS.md

import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createRequire } from "node:module";
import packageMetadata from "../package.json" with { type: "json" };

const require = createRequire(import.meta.url);
const version = packageMetadata.version;
const port = Number(process.env.PAYDANCE_WEB_QA_PORT ?? 4174);
const localUrl = `http://127.0.0.1:${port}/PayDance/`;
const qaDir = join(tmpdir(), `paydance-web-preview-qa-${version}`);
const storageKey = "paydance-web-preview-settings";
const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "medium", width: 960, height: 760 },
  { name: "mobile", width: 390, height: 844 },
];
const themes = ["light", "dark"];

const createPreviewState = (themeMode) => ({
  amountMode: "rolling",
  alwaysOnTop: true,
  config: {
    dailySalary: 360,
    enableLunchBreak: false,
    endTime: "18:30",
    hourlyRate: 45,
    lunchEnd: "13:30",
    lunchStart: "12:00",
    monthlySalary: 8000,
    salaryType: "monthly",
    startTime: "09:30",
    workDaysPerMonth: 22,
    workdays: [1, 2, 3, 4, 5],
  },
  hasCompletedOnboarding: true,
  isMiniMode: false,
  settingsVersion: 3,
  themeMode,
});

const resolvePlaywright = () => {
  const moduleDirs = [
    process.env.PLAYWRIGHT_NODE_MODULES,
    process.env.CODEX_NODE_MODULES,
    join(
      homedir(),
      ".cache",
      "codex-runtimes",
      "codex-primary-runtime",
      "dependencies",
      "node",
      "node_modules",
    ),
    resolve("node_modules"),
  ].filter(Boolean);

  for (const moduleDir of moduleDirs) {
    const packageDir = join(moduleDir, "playwright");
    if (existsSync(packageDir)) {
      return require(packageDir);
    }
  }

  return require("playwright");
};

const waitForServer = async () => {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(localUrl);
      if (response.ok) return;
    } catch {
      // Keep waiting until Vite is ready.
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 500));
  }

  throw new Error(`Web Preview dev server did not become ready at ${localUrl}`);
};

const stopServer = (server) => {
  if (server.exitCode !== null) return;

  if (process.platform === "win32") {
    execFileSync("taskkill", ["/pid", String(server.pid), "/t", "/f"], {
      stdio: "ignore",
    });
    return;
  }

  server.kill("SIGTERM");
};

const ensureQaDir = () => {
  rmSync(qaDir, { force: true, recursive: true });
  mkdirSync(qaDir, { recursive: true });
};

const startServer = () => {
  const server =
    process.platform === "win32"
      ? spawn(
          "cmd.exe",
          ["/d", "/s", "/c", `npm run dev:web -- --host 127.0.0.1 --port ${port}`],
          {
            cwd: resolve("."),
            env: { ...process.env, BROWSER: "none" },
            stdio: ["ignore", "pipe", "pipe"],
          },
        )
      : spawn(
          "npm",
          ["run", "dev:web", "--", "--host", "127.0.0.1", "--port", String(port)],
          {
            cwd: resolve("."),
            env: { ...process.env, BROWSER: "none" },
            stdio: ["ignore", "pipe", "pipe"],
          },
        );
  const logs = [];
  const collect = (chunk) => logs.push(chunk.toString());

  server.stdout.on("data", collect);
  server.stderr.on("data", collect);
  server.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(logs.join(""));
    }
  });

  return { logs, server };
};

const assertDom = async (page, viewportName) => {
  const viewport = page.viewportSize();
  const title = await page.title();
  if (title !== "薪跳 PayDance") {
    throw new Error(`${viewportName}: unexpected title "${title}"`);
  }

  const faviconHref = await page.locator('link[rel="icon"]').getAttribute("href");
  if (!faviconHref?.endsWith("/PayDance/favicon.png")) {
    throw new Error(`${viewportName}: favicon link mismatch "${faviconHref}"`);
  }

  const versionText = await page.locator(".web-preview__version").innerText();
  if (!versionText.includes("Web Preview") || !versionText.includes(version)) {
    throw new Error(`${viewportName}: version text mismatch "${versionText}"`);
  }

  const footerText = await page.locator(".web-preview__footer").innerText();
  const legacyAuthor = ["Mr", "Ba" + "ober"].join(".");
  if (!footerText.includes("Mr.Baoboer") || footerText.includes(legacyAuthor)) {
    throw new Error(
      `${viewportName}: footer author attribution mismatch "${footerText}"`,
    );
  }

  const showcase = page.locator("#paydance-preview");
  if ((await showcase.count()) !== 1) {
    throw new Error(`${viewportName}: software showcase is missing`);
  }

  const showcaseBox = await showcase.boundingBox();
  if (!showcaseBox || showcaseBox.width < 260 || showcaseBox.height < 180) {
    throw new Error(`${viewportName}: software showcase collapsed`);
  }

  const headlineVisible = await page
    .getByText("看见每一秒的", { exact: true })
    .isVisible();
  const downloadVisible = await page
    .getByRole("link", { name: /下载 Windows 版/ })
    .isVisible();
  if (!headlineVisible || !downloadVisible) {
    throw new Error(`${viewportName}: core hero content is not visible`);
  }

  const featureCards = await page.locator(".web-preview__chip").evaluateAll((cards) =>
    cards.map((card) => {
      const rect = card.getBoundingClientRect();
      return {
        bottom: rect.bottom,
        height: rect.height,
        left: rect.left,
        right: rect.right,
        top: rect.top,
        width: rect.width,
      };
    }),
  );
  if (featureCards.length !== 3) {
    throw new Error(`${viewportName}: expected 3 feature cards`);
  }

  const cardTop = featureCards[0].top;
  const cardsShareRow = featureCards.every((card) => Math.abs(card.top - cardTop) <= 3);
  if (!cardsShareRow) {
    throw new Error(
      `${viewportName}: feature cards wrapped instead of staying in one row`,
    );
  }

  const sortedFeatureCards = [...featureCards].sort((a, b) => a.left - b.left);
  for (let index = 0; index < sortedFeatureCards.length - 1; index += 1) {
    const currentCard = sortedFeatureCards[index];
    const nextCard = sortedFeatureCards[index + 1];
    if (currentCard.right > nextCard.left + 1) {
      throw new Error(`${viewportName}: feature cards overlap horizontally`);
    }
  }

  if (viewportName.includes("mobile")) {
    const [featureStripBox, footerBox, leadMetrics] = await Promise.all([
      page.locator(".web-preview__feature-strip").boundingBox(),
      page.locator(".web-preview__footer").boundingBox(),
      page.locator(".web-preview__lead").evaluate((lead) => {
        const rect = lead.getBoundingClientRect();
        const styles = window.getComputedStyle(lead);
        const headlineRect = document
          .querySelector(".web-preview h1")
          ?.getBoundingClientRect();

        return {
          fontSize: Number.parseFloat(styles.fontSize),
          fontWeight: Number.parseFloat(styles.fontWeight),
          gapFromHeadline: headlineRect ? rect.top - headlineRect.bottom : 0,
          width: rect.width,
        };
      }),
    ]);

    if (!featureStripBox || !footerBox) {
      throw new Error(`${viewportName}: feature strip or footer is missing`);
    }

    const footerGap = footerBox.y - (featureStripBox.y + featureStripBox.height);
    if (footerGap < 16) {
      throw new Error(`${viewportName}: feature strip is too close to the footer`);
    }

    if (
      viewport &&
      featureStripBox.y < viewport.height &&
      featureStripBox.y + featureStripBox.height > viewport.height - 8
    ) {
      throw new Error(`${viewportName}: feature strip is clipped at viewport bottom`);
    }

    if (
      leadMetrics.width > 330 ||
      leadMetrics.fontSize > 16 ||
      leadMetrics.fontWeight > 560 ||
      leadMetrics.gapFromHeadline < 12
    ) {
      throw new Error(`${viewportName}: lead typography is too large or too tight`);
    }
  }

  if (viewportName.startsWith("dark/")) {
    const darkStage = await page.locator(".web-preview").evaluate((root) => {
      const hero = root.querySelector(".web-preview__hero");
      const frame = root.querySelector(".web-preview__frame");
      const showcase = root.querySelector(".web-preview__showcase");
      const rootStyles = window.getComputedStyle(root);
      const heroMaterialStyles = hero ? window.getComputedStyle(hero, "::before") : null;
      const frameStyles = frame ? window.getComputedStyle(frame) : null;
      const showcaseAuraStyles = showcase
        ? window.getComputedStyle(showcase, "::before")
        : null;
      const showcaseSurfaceStyles = showcase
        ? window.getComputedStyle(showcase, "::after")
        : null;

      return {
        frameShadow: frameStyles?.boxShadow ?? "",
        heroMaterialBackground: heroMaterialStyles?.backgroundImage ?? "",
        heroMaterialOpacity: Number.parseFloat(heroMaterialStyles?.opacity ?? "0"),
        pageBackground: rootStyles.backgroundImage,
        stageAura: rootStyles.getPropertyValue("--web-stage-aura").trim(),
        stageReflection: rootStyles.getPropertyValue("--web-stage-reflection").trim(),
        stageSurface: rootStyles.getPropertyValue("--web-stage-surface").trim(),
        showcaseAuraBackground: showcaseAuraStyles?.backgroundImage ?? "",
        showcaseSurfaceBackground: showcaseSurfaceStyles?.backgroundImage ?? "",
        showcaseSurfaceOpacity: Number.parseFloat(showcaseSurfaceStyles?.opacity ?? "0"),
      };
    });

    const hasLineDecoration = [
      darkStage.pageBackground,
      darkStage.heroMaterialBackground,
      darkStage.showcaseAuraBackground,
      darkStage.showcaseSurfaceBackground,
    ].some((background) => background.includes("repeating-linear-gradient"));

    if (
      hasLineDecoration ||
      !darkStage.pageBackground.includes("linear-gradient") ||
      !darkStage.heroMaterialBackground.includes("linear-gradient") ||
      darkStage.heroMaterialOpacity < 0.42 ||
      darkStage.showcaseSurfaceOpacity < 0.42 ||
      !darkStage.frameShadow.includes("245, 158, 11") ||
      !darkStage.stageAura.includes("245 158 11") ||
      !darkStage.stageReflection.includes("245 158 11") ||
      !darkStage.stageSurface.includes("linear-gradient")
    ) {
      throw new Error(`${viewportName}: dark material stage separation is missing`);
    }
  }

  const actions = await page.locator(".web-preview__action").evaluateAll((links) =>
    links.map((link) => {
      const linkRect = link.getBoundingClientRect();
      const styles = window.getComputedStyle(link);
      const iconOffsets = Array.from(link.querySelectorAll("svg")).map((icon) => {
        const iconRect = icon.getBoundingClientRect();
        return Math.abs(
          iconRect.top + iconRect.height / 2 - (linkRect.top + linkRect.height / 2),
        );
      });
      const labelOffsets = Array.from(
        link.querySelectorAll(".web-preview__action-label"),
      ).map((label) => {
        const labelRect = label.getBoundingClientRect();
        return Math.abs(
          labelRect.top + labelRect.height / 2 - (linkRect.top + linkRect.height / 2),
        );
      });

      return {
        alignItems: styles.alignItems,
        display: styles.display,
        iconOffsets,
        labelOffsets,
      };
    }),
  );
  if (
    actions.some(
      (action) =>
        !["flex", "inline-flex"].includes(action.display) ||
        action.alignItems !== "center" ||
        action.iconOffsets.some((offset) => offset > 3) ||
        action.labelOffsets.length !== 1 ||
        action.labelOffsets.some((offset) => offset > 3),
    )
  ) {
    throw new Error(`${viewportName}: action button content is not vertically centered`);
  }
};

const assertThemeToggleEdge = async (page, viewportName) => {
  const themeToggleLabels = ["切换到深色模式", "切换到浅色模式"];
  const themeToggleNamePattern = new RegExp(themeToggleLabels.join("|"));

  for (let index = 0; index < 8; index += 1) {
    await page.getByRole("button", { name: themeToggleNamePattern }).click();
    await page.waitForTimeout(90);

    const frameEdge = await page.locator(".web-preview__frame").evaluate((frame) => {
      const styles = window.getComputedStyle(frame);
      return {
        borderBottomWidth: styles.borderBottomWidth,
        borderLeftWidth: styles.borderLeftWidth,
        borderRightWidth: styles.borderRightWidth,
        borderTopWidth: styles.borderTopWidth,
        boxShadow: styles.boxShadow,
        visible: frame.getBoundingClientRect().width > 0,
      };
    });

    const borderWidths = [
      frameEdge.borderBottomWidth,
      frameEdge.borderLeftWidth,
      frameEdge.borderRightWidth,
      frameEdge.borderTopWidth,
    ];
    if (
      !frameEdge.visible ||
      borderWidths.some((width) => width !== "0px") ||
      !frameEdge.boxShadow.includes("inset")
    ) {
      throw new Error(
        `${viewportName}: preview frame edge changed during theme switching`,
      );
    }
  }
};

const runQa = async () => {
  ensureQaDir();

  const { chromium } = resolvePlaywright();
  const { logs, server } = startServer();

  try {
    await waitForServer();
    console.log(`Web Preview QA URL: ${localUrl}`);

    const browser = await chromium.launch({ headless: true });
    const consoleFindings = [];
    const pageErrors = [];

    for (const themeMode of themes) {
      for (const viewport of viewports) {
        const context = await browser.newContext({
          deviceScaleFactor: 1,
          viewport: { width: viewport.width, height: viewport.height },
        });
        await context.addInitScript(
          ({ key, state }) => {
            window.localStorage.setItem(key, JSON.stringify(state));
          },
          { key: storageKey, state: createPreviewState(themeMode) },
        );

        const page = await context.newPage();
        page.on("console", (message) => {
          if (message.type() === "error") {
            consoleFindings.push(`${themeMode}/${viewport.name}: ${message.text()}`);
          }
        });
        page.on("pageerror", (error) => {
          pageErrors.push(`${themeMode}/${viewport.name}: ${error.message}`);
        });

        await page.goto(localUrl, { timeout: 60_000, waitUntil: "commit" });
        await page.locator("#paydance-preview").waitFor({
          state: "visible",
          timeout: 45_000,
        });
        await assertDom(page, `${themeMode}/${viewport.name}`);
        await assertThemeToggleEdge(page, `${themeMode}/${viewport.name}`);

        const screenshotPath = join(
          qaDir,
          `web-preview-${themeMode}-${viewport.name}-${viewport.width}x${viewport.height}.png`,
        );
        await page.screenshot({ fullPage: true, path: screenshotPath });
        await context.close();
      }
    }

    await browser.close();

    if (consoleFindings.length > 0 || pageErrors.length > 0) {
      throw new Error(
        [
          "Web Preview console/page errors found:",
          ...consoleFindings,
          ...pageErrors,
        ].join("\n"),
      );
    }

    writeFileSync(
      join(qaDir, "summary.json"),
      JSON.stringify(
        {
          localUrl,
          qaDir,
          screenshots: themes.flatMap((themeMode) =>
            viewports.map((viewport) => ({
              name: `${themeMode}-${viewport.name}`,
              path: join(
                qaDir,
                `web-preview-${themeMode}-${viewport.name}-${viewport.width}x${viewport.height}.png`,
              ),
              themeMode,
              viewport,
            })),
          ),
          version,
        },
        null,
        2,
      ),
      "utf8",
    );

    console.log(`Web Preview QA screenshots: ${qaDir}`);
  } catch (error) {
    console.error(logs.join(""));
    throw error;
  } finally {
    stopServer(server);
  }
};

runQa().catch((error) => {
  console.error(error);
  process.exit(1);
});
