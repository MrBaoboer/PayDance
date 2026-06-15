// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { execFileSync, spawn } from "node:child_process";
import { copyFileSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import packageMetadata from "../package.json" with { type: "json" };
import { resolvePlaywright } from "./resolve-playwright.mjs";
import {
  comparePngFiles,
  isVisualRegression,
  visualMaxDiffRatio,
} from "./visual-diff.mjs";

const version = packageMetadata.version;
const sanitizeRunId = (value) =>
  value
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
const readCurrentCommit = () => {
  try {
    return execFileSync("git", ["rev-parse", "--short=12", "HEAD"], {
      cwd: resolve("."),
      encoding: "utf8",
    }).trim();
  } catch {
    return "unknown";
  }
};
const commitSha = sanitizeRunId(
  (process.env.GITHUB_SHA?.slice(0, 12) || readCurrentCommit()).trim(),
);
const runTimestamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
const runId = sanitizeRunId(
  process.env.PAYDANCE_WEB_QA_RUN_ID || `${commitSha}-${runTimestamp}`,
);
const port = Number(process.env.PAYDANCE_WEB_QA_PORT ?? 4174);
const localUrl = `http://127.0.0.1:${port}/PayDance/`;
const localeUrls = {
  "zh-CN": localUrl,
  en: `${localUrl}en/`,
};
const qaRoot = process.env.RUNNER_TEMP ?? tmpdir();
const qaDir = join(qaRoot, `paydance-web-preview-qa-${version}-${runId}`);
const visualBaselineDir = resolve("tests", "visual-baselines");
const updateVisualBaselines = process.argv.includes("--update-visual-baselines");
const storageKey = "paydance-web-preview-settings";
const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "medium", width: 960, height: 760 },
  { name: "mobile", width: 390, height: 844 },
];
const locales = ["zh-CN", "en"];
const themes = ["light", "dark"];
const localeExpectations = {
  "zh-CN": {
    downloadName: /下载 Windows 版/,
    headline: "看见每一秒的",
    themeToggleLabels: ["切换到深色模式", "切换到浅色模式"],
  },
  en: {
    downloadName: /Download for Windows/,
    headline: "See Your Pay",
    themeToggleLabels: ["Switch to dark mode", "Switch to light mode"],
  },
};
const seoExpectations = {
  "zh-CN": {
    canonical: "https://masterbao66.github.io/PayDance/",
    title: "薪跳 PayDance — Windows 桌面实时工资看板",
  },
  en: {
    canonical: "https://masterbao66.github.io/PayDance/en/",
    title: "PayDance — Real-Time Salary Dashboard for Windows",
  },
};
const alternateUrls = {
  "zh-CN": "https://masterbao66.github.io/PayDance/",
  en: "https://masterbao66.github.io/PayDance/en/",
  "x-default": "https://masterbao66.github.io/PayDance/",
};

const assertSeoMetadata = async (page, viewportName, locale) => {
  const metadata = await page.evaluate(() => {
    const structuredData = document.querySelector(
      'script[type="application/ld+json"]',
    )?.textContent;

    return {
      alternates: Object.fromEntries(
        [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map((link) => [
          link.getAttribute("hreflang"),
          link.getAttribute("href"),
        ]),
      ),
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href"),
      structuredData: structuredData ? JSON.parse(structuredData) : null,
      title: document.title,
    };
  });
  const expected = seoExpectations[locale];

  if (metadata.title !== expected.title) {
    throw new Error(`${viewportName}: SEO title mismatch "${metadata.title}"`);
  }
  if (metadata.canonical !== expected.canonical) {
    throw new Error(`${viewportName}: canonical mismatch "${metadata.canonical}"`);
  }
  for (const [hreflang, url] of Object.entries(alternateUrls)) {
    if (metadata.alternates[hreflang] !== url) {
      throw new Error(
        `${viewportName}: hreflang ${hreflang} mismatch "${metadata.alternates[hreflang]}"`,
      );
    }
  }
  if (metadata.structuredData?.inLanguage !== locale) {
    throw new Error(
      `${viewportName}: JSON-LD language mismatch "${metadata.structuredData?.inLanguage}"`,
    );
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(metadata.structuredData?.dateModified ?? "")) {
    throw new Error(`${viewportName}: JSON-LD dateModified is not a build date`);
  }
};

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

const isVisualBaselineCase = (locale, themeMode, viewportName) =>
  ((locale === "zh-CN" && themeMode === "light") ||
    (locale === "en" && themeMode === "dark")) &&
  ["desktop", "mobile"].includes(viewportName);

const stabilizeVisualPage = async (page) => {
  await page.addStyleTag({
    content: `
      *,
      *::before,
      *::after {
        animation-delay: 0s !important;
        animation-duration: 0s !important;
        caret-color: transparent !important;
        transition-delay: 0s !important;
        transition-duration: 0s !important;
      }
    `,
  });
  await page.evaluate(() => document.fonts.ready.then(() => true));
  await page.waitForTimeout(150);
};

const readThemePaint = (page) =>
  page.evaluate(() => {
    const read = (selector, property) => {
      const element = document.querySelector(selector);
      return element ? window.getComputedStyle(element)[property] : null;
    };

    return {
      frameBackground: read(".web-preview__frame", "backgroundColor"),
      languageBackground: read(".lang-switcher", "backgroundColor"),
      rootBackground: read(".web-preview", "backgroundImage"),
      rootColor: read(".web-preview", "color"),
      themeClass: document.querySelector(".web-preview")?.className ?? null,
    };
  });

const assertStableInitialThemePaint = async (page, caseName) => {
  const initialPaint = await readThemePaint(page);
  await page.waitForTimeout(220);
  const settledPaint = await readThemePaint(page);

  if (JSON.stringify(initialPaint) !== JSON.stringify(settledPaint)) {
    throw new Error(
      `${caseName}: theme colors changed after first paint ${JSON.stringify({
        initialPaint,
        settledPaint,
      })}`,
    );
  }
};

const assertVisualBaseline = ({ locale, screenshotPath, themeMode, viewport }) => {
  if (!isVisualBaselineCase(locale, themeMode, viewport.name)) return null;

  const fileName = `web-preview-${locale}-${themeMode}-${viewport.name}-${viewport.width}x${viewport.height}.png`;
  const baselinePath = join(visualBaselineDir, fileName);

  if (updateVisualBaselines) {
    mkdirSync(visualBaselineDir, { recursive: true });
    copyFileSync(screenshotPath, baselinePath);
    return {
      baselinePath,
      mode: "updated",
      name: fileName,
    };
  }

  const expectedPath = join(qaDir, `expected-${fileName}`);
  const diffPath = join(qaDir, `diff-${fileName}`);
  const result = comparePngFiles({
    actualPath: screenshotPath,
    baselinePath,
    diffPath,
  });
  copyFileSync(baselinePath, expectedPath);

  if (isVisualRegression(result.ratio)) {
    throw new Error(
      `Visual regression ${fileName}: ${result.diffPixels} pixels changed (${(
        result.ratio * 100
      ).toFixed(3)}%, budget ${(visualMaxDiffRatio * 100).toFixed(
        1,
      )}%). Expected: ${expectedPath}. Actual: ${screenshotPath}. Diff: ${diffPath}.`,
    );
  }

  return {
    ...result,
    baselinePath,
    expectedPath,
    mode: "compared",
    name: fileName,
  };
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
          [
            "/d",
            "/s",
            "/c",
            `npm run dev:web -- --host 127.0.0.1 --port ${port} --force`,
          ],
          {
            cwd: resolve("."),
            env: { ...process.env, BROWSER: "none" },
            stdio: ["ignore", "pipe", "pipe"],
          },
        )
      : spawn(
          "npm",
          [
            "run",
            "dev:web",
            "--",
            "--host",
            "127.0.0.1",
            "--port",
            String(port),
            "--force",
          ],
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

const assertAccessibility = async (page, viewportName) => {
  const results = await new AxeBuilder({ page }).include(".web-preview").analyze();
  const blockingViolations = results.violations.filter((violation) =>
    ["critical", "serious"].includes(violation.impact ?? ""),
  );

  if (blockingViolations.length > 0) {
    throw new Error(
      `${viewportName}: accessibility violations ${JSON.stringify(
        blockingViolations.map((violation) => ({
          id: violation.id,
          impact: violation.impact,
          nodes: violation.nodes.map((node) => ({
            failureSummary: node.failureSummary,
            html: node.html,
            target: node.target,
          })),
        })),
      )}`,
    );
  }
};

const assertDom = async (page, viewportName, locale) => {
  const viewport = page.viewportSize();
  const expectedText = localeExpectations[locale];
  const title = await page.title();
  if (title !== seoExpectations[locale].title) {
    throw new Error(`${viewportName}: unexpected title "${title}"`);
  }

  const faviconHref = await page.locator('link[rel="icon"]').getAttribute("href");
  if (!faviconHref?.endsWith("/PayDance/favicon.png")) {
    throw new Error(`${viewportName}: favicon link mismatch "${faviconHref}"`);
  }

  const versionText = await page.locator(".web-preview__version").innerText();
  if (
    !versionText.includes(version) ||
    (!viewportName.includes("mobile") && !versionText.includes("Web Preview"))
  ) {
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

  const rootLocale = await page.locator(".web-preview").getAttribute("data-locale");
  if (rootLocale !== locale) {
    throw new Error(`${viewportName}: locale marker mismatch "${rootLocale}"`);
  }

  const languageOptions = await page
    .locator(".lang-switcher__option")
    .evaluateAll((options) =>
      options.map((option) => ({
        active: option.classList.contains("is-active"),
        text: option.textContent?.trim(),
      })),
    );
  if (
    languageOptions.length !== 2 ||
    languageOptions.filter((option) => option.active).length !== 1
  ) {
    throw new Error(`${viewportName}: language switcher state is unclear`);
  }

  const headlineVisible = await page
    .getByText(expectedText.headline, { exact: true })
    .isVisible();
  const downloadName = viewportName.includes("mobile")
    ? locale === "zh-CN"
      ? /^下载电脑版$/
      : /^Desktop$/
    : expectedText.downloadName;
  const downloadVisible = await page
    .getByRole("link", { name: downloadName })
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

  const featureDescriptions = await page
    .locator(".web-preview__chip dd")
    .evaluateAll((descriptions) =>
      descriptions.map((description) => {
        const rect = description.getBoundingClientRect();
        const styles = window.getComputedStyle(description);
        const lineHeight = Number.parseFloat(styles.lineHeight);

        return {
          height: rect.height,
          lineHeight,
          text: description.textContent?.trim(),
          visible: rect.width > 0 && rect.height > 0,
          whiteSpace: styles.whiteSpace,
          wrapped: Number.isFinite(lineHeight) && rect.height > lineHeight * 1.35,
        };
      }),
    );

  if (viewportName.includes("mobile")) {
    const cardTop = featureCards[0].top;
    const cardsShareRow = featureCards.every((card) => Math.abs(card.top - cardTop) <= 6);
    if (!cardsShareRow) {
      throw new Error(
        `${viewportName}: feature cards stacked instead of staying centered in one row`,
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
  } else {
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

    if (
      featureDescriptions.some(
        (description) => description.visible && description.wrapped,
      )
    ) {
      throw new Error(
        `${viewportName}: feature descriptions wrapped ${JSON.stringify(featureDescriptions)}`,
      );
    }
  }

  const layout = await page.evaluate(() => {
    const rectFor = (selector) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return {
        bottom: rect.bottom,
        height: rect.height,
        left: rect.left,
        right: rect.right,
        top: rect.top,
        width: rect.width,
      };
    };
    const viewportWidth = document.documentElement.clientWidth;
    const h1 = rectFor(".web-preview h1");
    const headlineMain = rectFor(".web-preview__headline-main");
    const headlineAccent = rectFor(".web-preview__headline-accent");
    const actions = rectFor(".web-preview__actions");
    const showcase = rectFor("#paydance-preview");
    const topbar = rectFor(".web-preview__topbar");
    const version = rectFor(".web-preview__version");
    const languageSwitcher = rectFor(".lang-switcher");
    const featureStrip = rectFor(".web-preview__feature-strip");
    const visibleRects = [
      ["topbar", topbar],
      ["language-switcher", languageSwitcher],
      ["version", version],
      ["headline-main", headlineMain],
      ["headline-accent", headlineAccent],
      ["actions", actions],
      ["showcase", showcase],
      ["feature-strip", featureStrip],
    ].filter(([, rect]) => rect && rect.width > 0 && rect.height > 0);
    const outOfViewport = visibleRects
      .filter(([, rect]) => rect.left < -1 || rect.right > viewportWidth + 1)
      .map(([name, rect]) => ({
        left: rect.left,
        name,
        right: rect.right,
        viewportWidth,
      }));
    const h1PreviewOverlap =
      h1 && showcase
        ? h1.right > showcase.left - 8 &&
          h1.left < showcase.right &&
          h1.bottom > showcase.top &&
          h1.top < showcase.bottom
        : false;
    const wrappedLabels = [
      ".web-preview__headline-main",
      ".web-preview__headline-accent",
      ".web-preview__lead",
      ".web-preview__chip-copy",
    ]
      .flatMap((selector) =>
        [...document.querySelectorAll(selector)].map((element) => {
          const rect = element.getBoundingClientRect();
          const styles = window.getComputedStyle(element);
          const lineHeight = Number.parseFloat(styles.lineHeight);
          return {
            height: rect.height,
            lineHeight,
            selector,
            text: element.textContent?.trim(),
            wrapped: Number.isFinite(lineHeight) && rect.height > lineHeight * 1.35,
          };
        }),
      )
      .filter((entry) => entry.wrapped);

    return {
      documentOverflow: document.documentElement.scrollWidth - viewportWidth,
      h1PreviewOverlap,
      outOfViewport,
      wrappedLabels,
    };
  });

  if (layout.documentOverflow > 1 || layout.outOfViewport.length > 0) {
    throw new Error(
      `${viewportName}: storefront elements overflow viewport ${JSON.stringify(layout)}`,
    );
  }
  if (layout.h1PreviewOverlap) {
    throw new Error(`${viewportName}: headline overlaps the software preview`);
  }
  if (layout.wrappedLabels.length > 0) {
    throw new Error(
      `${viewportName}: key storefront labels wrapped ${JSON.stringify(layout.wrappedLabels)}`,
    );
  }

  if (viewportName.includes("medium")) {
    const mediumHeroFlow = await page.evaluate(() => {
      const rectFor = (selector) => {
        const element = document.querySelector(selector);
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        return {
          bottom: rect.bottom,
          centerX: rect.left + rect.width / 2,
          height: rect.height,
          left: rect.left,
          right: rect.right,
          top: rect.top,
          width: rect.width,
        };
      };
      const viewportWidth = document.documentElement.clientWidth;
      const actions = rectFor(".web-preview__actions");
      const copy = rectFor(".web-preview__copy");
      const showcase = rectFor("#paydance-preview");
      const preview = document.querySelector(".web-preview");
      const previewStyles = preview ? window.getComputedStyle(preview) : null;
      const rootStyles = window.getComputedStyle(document.documentElement);
      const bodyStyles = window.getComputedStyle(document.body);

      return {
        actions,
        bodyOverflowY: bodyStyles.overflowY,
        copy,
        copyCenterOffset: copy ? Math.abs(copy.centerX - viewportWidth / 2) : 0,
        documentScrollHeight: document.documentElement.scrollHeight,
        previewOverflowY: previewStyles?.overflowY ?? "",
        rootOverflowY: rootStyles.overflowY,
        showcase,
        showcaseCenterOffset: showcase
          ? Math.abs(showcase.centerX - viewportWidth / 2)
          : 0,
        viewportHeight: window.innerHeight,
        verticalGap: copy && showcase ? showcase.top - copy.bottom : 0,
      };
    });

    if (
      !mediumHeroFlow.copy ||
      !mediumHeroFlow.showcase ||
      mediumHeroFlow.verticalGap < 28 ||
      mediumHeroFlow.copyCenterOffset > 24 ||
      mediumHeroFlow.showcaseCenterOffset > 24
    ) {
      throw new Error(
        `${viewportName}: medium viewport hero should use centered single-column flow ${JSON.stringify(
          mediumHeroFlow,
        )}`,
      );
    }

    if (
      mediumHeroFlow.documentScrollHeight <= mediumHeroFlow.viewportHeight + 24 ||
      mediumHeroFlow.rootOverflowY === "hidden" ||
      mediumHeroFlow.bodyOverflowY === "hidden" ||
      mediumHeroFlow.previewOverflowY !== "visible"
    ) {
      throw new Error(
        `${viewportName}: medium viewport content must use document-level vertical scrolling ${JSON.stringify(
          mediumHeroFlow,
        )}`,
      );
    }
  }

  if (viewportName.includes("mobile")) {
    const [featureStripBox, footerBox, leadMetrics, salaryInfoMetrics] =
      await Promise.all([
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
        page.locator(".web-preview__frame").evaluate((frame) => {
          const frameRect = frame.getBoundingClientRect();
          const button = frame.querySelector(".salary-info-button");
          const progressTrack = frame.querySelector(".progress-track");
          const buttonRect = button?.getBoundingClientRect();
          const progressRect = progressTrack?.getBoundingClientRect();

          return buttonRect && progressRect
            ? {
                buttonCenter: buttonRect.top + buttonRect.height / 2,
                bottomGap: frameRect.bottom - buttonRect.bottom,
                centerOffset: Math.abs(
                  buttonRect.top +
                    buttonRect.height / 2 -
                    (progressRect.bottom + frameRect.bottom) / 2,
                ),
                height: buttonRect.height,
                midpoint: (progressRect.bottom + frameRect.bottom) / 2,
                progressBottom: progressRect.bottom,
              }
            : null;
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

    if (
      !salaryInfoMetrics ||
      salaryInfoMetrics.bottomGap < 18 ||
      salaryInfoMetrics.centerOffset > 6 ||
      salaryInfoMetrics.height > 30
    ) {
      throw new Error(
        `${viewportName}: salary info button should sit midway between progress and frame edge ${JSON.stringify(
          salaryInfoMetrics,
        )}`,
      );
    }
  }

  if (viewportName.includes("/dark/")) {
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
      const labelOffsets = Array.from(link.querySelectorAll(".web-preview__action-label"))
        .map((label) => label.getBoundingClientRect())
        .filter((labelRect) => labelRect.width > 0 && labelRect.height > 0)
        .map((labelRect) =>
          Math.abs(
            labelRect.top + labelRect.height / 2 - (linkRect.top + linkRect.height / 2),
          ),
        );

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

  return page.evaluate(() => ({
    chips: Array.from(document.querySelectorAll(".web-preview__chip-copy")).map((node) =>
      node.textContent?.trim(),
    ),
    headlineAccent: document
      .querySelector(".web-preview__headline-accent")
      ?.textContent?.trim(),
    headlineMain: document
      .querySelector(".web-preview__headline-main")
      ?.textContent?.trim(),
    lead: document.querySelector(".web-preview__lead")?.textContent?.trim(),
    locale: document.querySelector(".web-preview")?.getAttribute("data-locale"),
  }));
};

const assertThemeToggleEdge = async (page, viewportName, locale) => {
  const themeToggleLabels = localeExpectations[locale].themeToggleLabels;
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

const seedPreviewContext = async (browser, themeMode, viewport) => {
  const context = await browser.newContext({
    deviceScaleFactor: 1,
    timezoneId: "Asia/Shanghai",
    viewport: { width: viewport.width, height: viewport.height },
  });
  await context.addInitScript(
    ({ fixedTime, key, state }) => {
      const NativeDate = Date;
      class FixedDate extends NativeDate {
        constructor(...args) {
          super(...(args.length === 0 ? [fixedTime] : args));
        }

        static now() {
          return fixedTime;
        }
      }
      Object.setPrototypeOf(FixedDate, NativeDate);
      Object.defineProperty(window, "Date", { configurable: true, value: FixedDate });
      Object.defineProperty(performance, "now", {
        configurable: true,
        value: () => 0,
      });
      window.localStorage.setItem(key, JSON.stringify(state));
    },
    {
      fixedTime: Date.parse("2026-06-15T02:00:00.000Z"),
      key: storageKey,
      state: createPreviewState(themeMode),
    },
  );

  return context;
};

const assertLanguageSwitchFlow = async (browser, consoleFindings, pageErrors) => {
  const viewport = { name: "mobile", width: 390, height: 844 };
  const context = await seedPreviewContext(browser, "light", viewport);
  const page = await context.newPage();

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleFindings.push(`language-switch/mobile: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => {
    pageErrors.push(`language-switch/mobile: ${error.message}`);
  });

  try {
    await page.goto(localUrl, { timeout: 60_000, waitUntil: "domcontentloaded" });
    await page.locator("#paydance-preview").waitFor({
      state: "visible",
      timeout: 45_000,
    });
    await stabilizeVisualPage(page);

    const initialLocale = await page.locator(".web-preview").getAttribute("data-locale");
    if (initialLocale !== "zh-CN") {
      throw new Error(
        `language-switch/mobile: initial locale mismatch "${initialLocale}"`,
      );
    }

    await Promise.all([
      page.waitForURL(localeUrls.en, { timeout: 10_000 }),
      page.getByRole("link", { name: "Switch to English" }).click(),
    ]);
    await page.getByText(localeExpectations.en.headline, { exact: true }).waitFor({
      state: "visible",
      timeout: 10_000,
    });

    const switchedLocale = await page.locator(".web-preview").getAttribute("data-locale");
    if (switchedLocale !== "en") {
      throw new Error(
        `language-switch/mobile: switched locale mismatch "${switchedLocale}"`,
      );
    }

    await assertSeoMetadata(page, "language-switch/mobile", "en");
    const observedCopy = await assertDom(page, "language-switch/mobile", "en");
    await assertAccessibility(page, "language-switch/mobile");

    const screenshotPath = join(
      qaDir,
      `web-preview-language-switch-zh-CN-to-en-${viewport.name}-${viewport.width}x${viewport.height}.png`,
    );
    await page.screenshot({ fullPage: true, path: screenshotPath });

    return {
      locale: "zh-CN->en",
      observedCopy,
      screenshotPath,
      themeMode: "light",
      viewport,
    };
  } finally {
    await context.close();
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
    const observations = [];
    const visualComparisons = [];

    for (const locale of locales) {
      for (const themeMode of themes) {
        for (const viewport of viewports) {
          const context = await seedPreviewContext(browser, themeMode, viewport);
          const page = await context.newPage();
          page.on("console", (message) => {
            if (message.type() === "error") {
              consoleFindings.push(
                `${locale}/${themeMode}/${viewport.name}: ${message.text()}`,
              );
            }
          });
          page.on("pageerror", (error) => {
            pageErrors.push(`${locale}/${themeMode}/${viewport.name}: ${error.message}`);
          });

          await page.goto(localeUrls[locale], {
            timeout: 60_000,
            waitUntil: "domcontentloaded",
          });
          await page.locator("#paydance-preview").waitFor({
            state: "visible",
            timeout: 45_000,
          });
          await assertStableInitialThemePaint(
            page,
            `${locale}/${themeMode}/${viewport.name}`,
          );
          await stabilizeVisualPage(page);
          await assertSeoMetadata(
            page,
            `${locale}/${themeMode}/${viewport.name}`,
            locale,
          );
          const observedCopy = await assertDom(
            page,
            `${locale}/${themeMode}/${viewport.name}`,
            locale,
          );
          observations.push({
            locale,
            observedCopy,
            themeMode,
            viewport,
          });
          await assertAccessibility(page, `${locale}/${themeMode}/${viewport.name}`);
          await assertThemeToggleEdge(
            page,
            `${locale}/${themeMode}/${viewport.name}`,
            locale,
          );

          const screenshotPath = join(
            qaDir,
            `web-preview-${locale}-${themeMode}-${viewport.name}-${viewport.width}x${viewport.height}.png`,
          );
          await page.screenshot({ fullPage: true, path: screenshotPath });
          const visualComparison = assertVisualBaseline({
            locale,
            screenshotPath,
            themeMode,
            viewport,
          });
          if (visualComparison) visualComparisons.push(visualComparison);
          await context.close();
        }
      }
    }

    observations.push(
      await assertLanguageSwitchFlow(browser, consoleFindings, pageErrors),
    );

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
          commitSha,
          localUrl,
          qaDir,
          observedCopies: observations,
          runId,
          screenshots: locales.flatMap((locale) =>
            themes.flatMap((themeMode) =>
              viewports.map((viewport) => ({
                locale,
                name: `${locale}-${themeMode}-${viewport.name}`,
                path: join(
                  qaDir,
                  `web-preview-${locale}-${themeMode}-${viewport.name}-${viewport.width}x${viewport.height}.png`,
                ),
                themeMode,
                viewport,
              })),
            ),
          ),
          visualComparisons,
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
