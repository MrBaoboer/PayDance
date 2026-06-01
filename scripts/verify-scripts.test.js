// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const packageJson = JSON.parse(
  readFileSync(resolve(import.meta.dirname, "..", "package.json"), "utf8"),
);
const readRoot = (path) => readFileSync(resolve(import.meta.dirname, "..", path), "utf8");

describe("verification scripts", () => {
  it("keeps fast and release verification paths explicit", () => {
    expect(packageJson.scripts.dev).toContain("--mode desktop");
    expect(packageJson.scripts.build).toBe("npm run build:desktop");
    expect(packageJson.scripts["build:desktop"]).toContain("--mode desktop");
    expect(packageJson.scripts["build:desktop"]).toContain(
      "node scripts/assert-build-target.mjs desktop",
    );
    expect(packageJson.scripts["build:desktop"]).toContain(
      "node scripts/assert-build-boundary.mjs desktop",
    );
    expect(packageJson.scripts["build:web"]).toContain("--mode web");
    expect(packageJson.scripts["build:web"]).toContain(
      "node scripts/assert-build-target.mjs web",
    );
    expect(packageJson.scripts["build:web"]).toContain(
      "node scripts/assert-build-boundary.mjs web",
    );

    expect(packageJson.scripts["verify:fast"]).toContain("npm run check:hygiene");
    expect(packageJson.scripts["verify:fast"]).toContain("npm run lint");
    expect(packageJson.scripts["verify:fast"]).toContain("npm run build:desktop");
    expect(packageJson.scripts.verify).toBe("npm run verify:fast");
    expect(packageJson.scripts["verify:push"]).toBe(
      "node scripts/push-workflow.mjs --verify-only",
    );
    expect(packageJson.scripts["push:main"]).toBe("node scripts/push-workflow.mjs");

    expect(readRoot("src-tauri/tauri.conf.json")).toContain(
      '"beforeBuildCommand": "npm run build:desktop"',
    );
    expect(readRoot(".github/workflows/release.yml")).toContain(
      "node scripts/assert-build-target.mjs desktop",
    );
    expect(readRoot(".github/workflows/release.yml")).toContain(
      "node scripts/assert-build-boundary.mjs desktop",
    );

    expect(packageJson.scripts["verify:release"]).toContain("npm run version:check");
    expect(packageJson.scripts["verify:release"]).toContain("npm audit --omit=dev");
    expect(packageJson.scripts["verify:release"]).toContain("cargo fmt --all -- --check");
    expect(packageJson.scripts["verify:release"]).toContain(
      "cargo clippy --all-targets -- -D warnings",
    );
  });

  it("keeps the maintainer push workflow guarded end to end", () => {
    const pushWorkflow = readRoot("scripts/push-workflow.mjs");

    expect(pushWorkflow).toContain("npm run verify:push");
    expect(pushWorkflow).toContain("npm run push:main");
    expect(pushWorkflow).toContain("npm_execpath");
    expect(pushWorkflow).toContain("npm-cli.js");
    expect(pushWorkflow).not.toContain("npm.cmd");
    expect(pushWorkflow).toContain("cargo install cargo-audit --locked");
    expect(pushWorkflow).toContain("cargo install cargo-deny --version 0.19.8 --locked");
    expect(pushWorkflow).toContain('"build:desktop"');
    expect(pushWorkflow).toContain('"build:web"');
    expect(pushWorkflow).toContain('"audit", "--omit=dev"');
    expect(pushWorkflow).toContain('"audit"');
    expect(pushWorkflow).toContain('"deny", "check"');
    expect(pushWorkflow).toContain('"diff", "--check"');
    expect(pushWorkflow).toContain("Working tree is not clean");
    expect(pushWorkflow).toContain("Refusing to push from");
    expect(pushWorkflow).toContain("dependabot/alerts");
    expect(pushWorkflow).toContain("Open Dependabot alerts found");
    expect(pushWorkflow).toContain('watchWorkflow("CI"');
    expect(pushWorkflow).toContain('watchWorkflow("Web Preview"');

    expect(readRoot(".github/CONTRIBUTING.md")).toContain("npm run push:main");
    expect(readRoot("docs/CONTRIBUTING_EN.md")).toContain("npm run push:main");
  });

  it("codifies Web Preview QA through the Codex Playwright workflow", () => {
    expect(packageJson.scripts["qa:web-preview"]).toBe("node scripts/qa-web-preview.mjs");

    const qaScript = readRoot("scripts/qa-web-preview.mjs");
    expect(qaScript).toContain("playwright");
    expect(qaScript).toContain("desktop");
    expect(qaScript).toContain("medium");
    expect(qaScript).toContain("mobile");
    expect(qaScript).toContain('const locales = ["zh-CN", "en"]');
    expect(qaScript).toContain("1440");
    expect(qaScript).toContain("960");
    expect(qaScript).toContain("390");
    expect(qaScript).toContain("console");
    expect(qaScript).toContain("--force");
    expect(qaScript).toContain("Web Preview");
    expect(qaScript).toContain("PAYDANCE_WEB_QA_RUN_ID");
    expect(qaScript).toContain("commitSha");
    expect(qaScript).toContain("observedCopies");
    expect(qaScript).toContain("paydance-web-preview-qa-${version}-${runId}");
    expect(qaScript).toContain(".web-preview__chip");
    expect(qaScript).toContain(".web-preview__action");
    expect(qaScript).toContain(".web-preview__action-label");
    expect(qaScript).toContain("assertThemeToggleEdge");
    expect(qaScript).toContain("切换到深色模式");
    expect(qaScript).toContain("切换到浅色模式");
    expect(qaScript).toContain(
      'page.goto(localUrl, { timeout: 60_000, waitUntil: "domcontentloaded" })',
    );
    expect(qaScript).toContain("paydance-web-locale");

    const qaGuide = readRoot("docs/web-preview-qa.md");
    expect(qaGuide).toContain(
      "本地服务 + 内置 Playwright + 多视口截图 + DOM/console 双校验",
    );
    expect(qaGuide).toContain("不要使用 headless Chrome/CDP/CLI screenshot");
    expect(qaGuide).toContain(
      "C:\\Users\\mrbao\\AppData\\Local\\Temp\\paydance-web-preview-qa-{version}-{commit}-{timestamp}",
    );
    expect(qaGuide).toContain("不要复用仅包含版本号的固定目录");
    expect(qaGuide).toContain("页面实际读取到的中英文 DOM 文案");
  });
});
