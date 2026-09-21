// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";

import { classifyChangedFiles, scheduledAuditScope } from "./ci-change-scope.mjs";

const scriptPath = resolve(import.meta.dirname, "ci-change-scope.mjs");

const withTempDir = (callback) => {
  const cwd = mkdtempSync(join(tmpdir(), "paydance-ci-scope-"));

  try {
    return callback(cwd);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
};

describe("CI change scope", () => {
  it("treats documentation, legal, brand, and community files as lightweight", () => {
    const result = classifyChangedFiles([
      "README.md",
      "README_EN.md",
      "LICENSE",
      "SECURITY.md",
      "CONTRIBUTING.md",
      "CONTRIBUTING_EN.md",
      "CHANGELOG.md",
      "CODE_OF_CONDUCT.md",
      "docs/GOVERNANCE.md",
      "docs/MAINTAINERS.md",
      "PRODUCT.md",
      "DESIGN.md",
      "docs/web-preview-qa.md",
      "legal/ADDITIONAL_TERMS.md",
      "docs/posters/poster-02-three-step-setup-v3.png",
      ".github/CONTRIBUTING.md",
      ".github/ISSUE_TEMPLATE/bug_report.yml",
      ".github/PULL_REQUEST_TEMPLATE.md",
      ".github/SECURITY.md",
    ]);

    expect(result.scope).toBe("lightweight");
    expect(result.requiresFullCi).toBe(false);
    expect(result.requiresWindowsBuild).toBe(false);
    expect(result.requiresFrontend).toBe(false);
    expect(result.requiresRust).toBe(false);
    expect(result.requiresWebPreviewQa).toBe(false);
    expect(result.requiresSecurity).toBe(false);
    expect(result.requiresNpmAudit).toBe(false);
    expect(result.requiresCargoAudit).toBe(false);
    expect(result.requiresCodeql).toBe(false);
    expect(result.deployWebPreview).toBe(false);
    expect(result.reasons).toContain("all changed files are lightweight");
  });

  it("routes full-CI files to the smallest required job set", () => {
    expect(classifyChangedFiles(["src/App.vue"])).toMatchObject({
      scope: "full",
      requiresFullCi: true,
      requiresFrontend: true,
      requiresRust: false,
      requiresWebPreviewQa: true,
      requiresSecurity: false,
      requiresCodeql: true,
      requiresWindowsBuild: true,
    });

    expect(classifyChangedFiles(["src-tauri/src/lib.rs"])).toMatchObject({
      scope: "full",
      requiresFullCi: true,
      requiresFrontend: false,
      requiresRust: true,
      requiresWebPreviewQa: false,
      requiresSecurity: false,
      requiresCodeql: true,
      requiresWindowsBuild: true,
    });

    expect(classifyChangedFiles(["package-lock.json"])).toMatchObject({
      scope: "full",
      requiresFullCi: true,
      requiresFrontend: true,
      requiresRust: false,
      requiresWebPreviewQa: true,
      requiresSecurity: true,
      requiresNpmAudit: true,
      requiresCargoAudit: false,
      requiresCodeql: false,
      requiresWindowsBuild: true,
    });

    expect(classifyChangedFiles(["src-tauri/Cargo.lock"])).toMatchObject({
      scope: "full",
      requiresFullCi: true,
      requiresFrontend: false,
      requiresRust: true,
      requiresWebPreviewQa: false,
      requiresSecurity: true,
      requiresNpmAudit: false,
      requiresCargoAudit: true,
      requiresCodeql: true,
      requiresWindowsBuild: true,
    });

    expect(classifyChangedFiles(["scripts/push-workflow.mjs"])).toMatchObject({
      scope: "full",
      requiresFullCi: true,
      requiresFrontend: false,
      requiresRust: false,
      requiresWebPreviewQa: false,
      requiresSecurity: false,
      requiresCodeql: true,
      requiresWindowsBuild: false,
    });

    expect(classifyChangedFiles([".github/workflows/release.yml"])).toMatchObject({
      scope: "full",
      requiresFullCi: true,
      requiresFrontend: false,
      requiresRust: false,
      requiresWebPreviewQa: false,
      requiresSecurity: true,
      requiresCodeql: false,
      requiresWindowsBuild: false,
    });

    expect(
      classifyChangedFiles([".github/workflows/post-release-smoke.yml"]),
    ).toMatchObject({
      scope: "full",
      requiresFullCi: true,
      requiresFrontend: false,
      requiresRust: false,
      requiresWebPreviewQa: false,
      requiresSecurity: true,
      requiresCodeql: false,
      requiresWindowsBuild: false,
    });

    expect(classifyChangedFiles([".github/workflows/codeql.yml"])).toMatchObject({
      scope: "full",
      requiresFullCi: true,
      requiresFrontend: false,
      requiresRust: false,
      requiresWebPreviewQa: false,
      requiresSecurity: true,
      requiresNpmAudit: false,
      requiresCargoAudit: false,
      requiresCodeql: true,
      requiresWindowsBuild: false,
    });

    expect(classifyChangedFiles(["mystery.config"])).toMatchObject({
      scope: "full",
      requiresFullCi: true,
      requiresFrontend: true,
      requiresRust: true,
      requiresWebPreviewQa: true,
      requiresSecurity: true,
      requiresNpmAudit: true,
      requiresCargoAudit: true,
      requiresCodeql: true,
      requiresWindowsBuild: true,
    });
  });

  // 一条 Rust 公告不该拦下只改 npm 的 Dependabot PR，反之亦然：审计结论只由
  // 各自的锁文件决定，跑另一边的审计对这个 PR 没有任何判别价值。
  it("scopes npm and cargo audits to their own manifests", () => {
    expect(classifyChangedFiles(["package.json"])).toMatchObject({
      requiresNpmAudit: true,
      requiresCargoAudit: false,
    });
    expect(classifyChangedFiles(["src-tauri/Cargo.toml"])).toMatchObject({
      requiresNpmAudit: false,
      requiresCargoAudit: true,
    });
    expect(classifyChangedFiles(["src-tauri/deny.toml"])).toMatchObject({
      requiresNpmAudit: false,
      requiresCargoAudit: true,
    });
    expect(classifyChangedFiles(["src-tauri/.cargo/audit.toml"])).toMatchObject({
      requiresNpmAudit: false,
      requiresCargoAudit: true,
    });
    // 审计 job 本身的定义变了，两边都要重跑。
    expect(classifyChangedFiles([".github/workflows/ci.yml"])).toMatchObject({
      requiresSecurity: true,
      requiresNpmAudit: true,
      requiresCargoAudit: true,
    });
    // 只跑 gitleaks 的文件：security job 开着，两项依赖审计都关。
    for (const file of [
      ".gitleaks.toml",
      ".github/dependabot.yml",
      ".github/workflows/release.yml",
      ".github/workflows/post-release-smoke.yml",
    ]) {
      expect(classifyChangedFiles([file]), file).toMatchObject({
        requiresSecurity: true,
        requiresNpmAudit: false,
        requiresCargoAudit: false,
      });
    }
  });

  // 定时审计只跑 security job：公告随时发布，只有按时重跑才能在它拦住下一条
  // 无关提交之前发现；前端 / Rust / Web Preview / CodeQL 与改动无关，一律跳过。
  it("runs only the security job for the scheduled audit", () => {
    expect(scheduledAuditScope()).toEqual({
      changedFiles: [],
      scope: "scheduled-audit",
      isLightweight: false,
      requiresFullCi: false,
      requiresWindowsBuild: false,
      requiresFrontend: false,
      requiresRust: false,
      requiresWebPreviewQa: false,
      requiresSecurity: true,
      requiresNpmAudit: true,
      requiresCargoAudit: true,
      requiresCodeql: false,
      deployWebPreview: false,
      reasons: ["scheduled dependency audit"],
    });

    withTempDir((cwd) => {
      const outputPath = join(cwd, "github-output.txt");
      const jsonPath = join(cwd, "scope.json");

      execFileSync(
        "node",
        [
          scriptPath,
          "--event",
          "schedule",
          "--base",
          "0123456789abcdef0123456789abcdef01234567",
          "--head",
          "HEAD",
          "--github-output",
          outputPath,
          "--json-file",
          jsonPath,
        ],
        { encoding: "utf8" },
      );

      const output = readFileSync(outputPath, "utf8");
      const summary = JSON.parse(readFileSync(jsonPath, "utf8"));

      expect(output).toContain("scope=scheduled-audit");
      expect(output).toContain("requires_frontend=false");
      expect(output).toContain("requires_rust=false");
      expect(output).toContain("requires_web_preview_qa=false");
      expect(output).toContain("requires_security=true");
      expect(output).toContain("requires_npm_audit=true");
      expect(output).toContain("requires_cargo_audit=true");
      expect(output).toContain("requires_codeql=false");
      expect(output).toContain("deploy_web_preview=false");
      expect(summary.deployWebPreview).toBe(false);
    });

    // 其它事件名不改变按文件分类的结果。
    expect(
      execFileSync("node", [scriptPath, "--event", "push", "--files", "README.md"], {
        encoding: "utf8",
      }),
    ).toContain('"scope": "lightweight"');
  });

  it("deploys Web Preview only for web-affecting full-CI changes", () => {
    expect(classifyChangedFiles(["src/WebPreviewApp.vue"]).deployWebPreview).toBe(true);
    expect(classifyChangedFiles(["en/index.html"]).deployWebPreview).toBe(true);
    expect(classifyChangedFiles(["public/robots.txt"]).deployWebPreview).toBe(true);
    expect(classifyChangedFiles(["scripts/web-seo.mjs"]).deployWebPreview).toBe(true);
    expect(classifyChangedFiles(["package-lock.json"]).deployWebPreview).toBe(true);
    expect(classifyChangedFiles(["vite.config.ts"]).deployWebPreview).toBe(true);
    expect(
      classifyChangedFiles([".github/workflows/web-preview.yml"]).deployWebPreview,
    ).toBe(true);

    expect(classifyChangedFiles(["src-tauri/src/lib.rs"]).deployWebPreview).toBe(false);
    expect(classifyChangedFiles(["README.md"]).deployWebPreview).toBe(false);
  });

  it("fails closed when no changed files are detected", () => {
    const result = classifyChangedFiles([]);

    expect(result.scope).toBe("full");
    expect(result.requiresFullCi).toBe(true);
    expect(result.requiresWindowsBuild).toBe(true);
    expect(result.requiresFrontend).toBe(true);
    expect(result.requiresRust).toBe(true);
    expect(result.requiresWebPreviewQa).toBe(true);
    expect(result.requiresSecurity).toBe(true);
    expect(result.requiresNpmAudit).toBe(true);
    expect(result.requiresCargoAudit).toBe(true);
    expect(result.requiresCodeql).toBe(true);
    expect(result.reasons).toContain("no changed files detected");
  });

  it("writes GitHub outputs and a JSON summary from the CLI", () => {
    withTempDir((cwd) => {
      const outputPath = join(cwd, "github-output.txt");
      const jsonPath = join(cwd, "scope.json");

      execFileSync(
        "node",
        [
          scriptPath,
          "--files",
          "README.md",
          "legal/ADDITIONAL_TERMS.md",
          "--github-output",
          outputPath,
          "--json-file",
          jsonPath,
        ],
        { encoding: "utf8" },
      );

      const output = readFileSync(outputPath, "utf8");
      const summary = JSON.parse(readFileSync(jsonPath, "utf8"));

      expect(output).toContain("scope=lightweight");
      expect(output).toContain("requires_full_ci=false");
      expect(output).toContain("requires_frontend=false");
      expect(output).toContain("requires_rust=false");
      expect(output).toContain("requires_web_preview_qa=false");
      expect(output).toContain("requires_security=false");
      expect(output).toContain("requires_npm_audit=false");
      expect(output).toContain("requires_cargo_audit=false");
      expect(output).toContain("requires_codeql=false");
      expect(output).toContain("deploy_web_preview=false");
      expect(summary.changedFiles).toEqual(["README.md", "legal/ADDITIONAL_TERMS.md"]);
    });
  });

  it("falls back to the head tree when the push base is unavailable", () => {
    withTempDir((cwd) => {
      const jsonPath = join(cwd, "scope.json");

      execFileSync(
        "node",
        [
          scriptPath,
          "--base",
          "0123456789abcdef0123456789abcdef01234567",
          "--head",
          "HEAD",
          "--json-file",
          jsonPath,
        ],
        { encoding: "utf8" },
      );

      const summary = JSON.parse(readFileSync(jsonPath, "utf8"));

      expect(summary.scope).toBe("full");
      expect(summary.requiresFullCi).toBe(true);
      expect(summary.changedFiles).toContain("package.json");
    });
  });
});
