// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";

import { classifyChangedFiles } from "./ci-change-scope.mjs";

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
      "GOVERNANCE.md",
      "MAINTAINERS.md",
      "PRODUCT.md",
      "DESIGN.md",
      "docs/web-preview-qa.md",
      "legal/ADDITIONAL_TERMS.md",
      "marketing-posters/poster.png",
      ".github/ISSUE_TEMPLATE/bug_report.yml",
      ".github/PULL_REQUEST_TEMPLATE.md",
    ]);

    expect(result.scope).toBe("lightweight");
    expect(result.requiresFullCi).toBe(false);
    expect(result.requiresWindowsBuild).toBe(false);
    expect(result.deployWebPreview).toBe(false);
    expect(result.reasons).toContain("all changed files are lightweight");
  });

  it("requires full CI for app, Tauri, dependency, script, workflow, and unknown files", () => {
    for (const file of [
      "src/App.vue",
      "src-tauri/src/lib.rs",
      "package.json",
      "package-lock.json",
      "scripts/push-workflow.mjs",
      ".github/workflows/ci.yml",
      "vite.config.ts",
      ".gitleaks.toml",
    ]) {
      const result = classifyChangedFiles([file]);

      expect(result.scope, file).toBe("full");
      expect(result.requiresFullCi, file).toBe(true);
      expect(result.requiresWindowsBuild, file).toBe(true);
      expect(result.reasons.join("\n"), file).toContain(file);
    }
  });

  it("deploys Web Preview only for web-affecting full-CI changes", () => {
    expect(classifyChangedFiles(["src/WebPreviewApp.vue"]).deployWebPreview).toBe(true);
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
      expect(output).toContain("deploy_web_preview=false");
      expect(summary.changedFiles).toEqual(["README.md", "legal/ADDITIONAL_TERMS.md"]);
    });
  });
});
