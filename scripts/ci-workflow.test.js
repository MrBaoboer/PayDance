// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readRoot = (path) => readFileSync(resolve(import.meta.dirname, "..", path), "utf8");
const packageJson = JSON.parse(readRoot("package.json"));

describe("CI workflow routing", () => {
  it("keeps metadata verification lightweight and explicit", () => {
    expect(packageJson.scripts["verify:metadata"]).toContain("npm run check:hygiene");
    expect(packageJson.scripts["verify:metadata"]).toContain("npm run format:check");
    expect(packageJson.scripts["verify:metadata"]).toContain(
      "scripts/repository-metadata.test.js",
    );
    expect(packageJson.scripts["verify:metadata"]).toContain(
      "scripts/ci-change-scope.test.js",
    );
    expect(packageJson.scripts["verify:metadata"]).toContain(
      "scripts/ci-workflow.test.js",
    );
    expect(packageJson.scripts["verify:metadata"]).toContain(
      "scripts/source-header.test.js",
    );
    expect(packageJson.scripts["verify:metadata"]).toContain("git diff --check");
    expect(packageJson.scripts["verify:metadata"]).not.toContain("build:desktop");
    expect(packageJson.scripts["verify:metadata"]).not.toContain("build:web");
  });

  it("keeps the maintainer push workflow path-sensitive", () => {
    const pushWorkflow = readRoot("scripts/push-workflow.mjs");

    expect(pushWorkflow).toContain("classifyChangedFiles");
    expect(pushWorkflow).toContain("Local change scope");
    expect(pushWorkflow).toContain("verify:metadata");
    expect(pushWorkflow).toContain("scope.requiresFullCi");
    expect(pushWorkflow).toContain("scope.deployWebPreview");
    expect(pushWorkflow).toContain("Fast daily checks");
    expect(pushWorkflow).not.toContain('"build:desktop"');
    expect(pushWorkflow).not.toContain('"build:web"');
    expect(pushWorkflow).toContain('watchWorkflow("CI"');
    expect(pushWorkflow).toContain('watchWorkflow("Web Preview"');
  });

  it("keeps CI path-sensitive and deploys Web Preview only after eligible main success", () => {
    const ciWorkflow = readRoot(".github/workflows/ci.yml");
    const webPreviewWorkflow = readRoot(".github/workflows/web-preview.yml");

    expect(ciWorkflow).toContain("Detect change scope");
    expect(ciWorkflow).toContain("node scripts/ci-change-scope.mjs");
    expect(ciWorkflow).toContain("ci-change-scope");
    expect(ciWorkflow).toContain("requires_full_ci");
    expect(ciWorkflow).toContain("deploy_web_preview");
    expect(ciWorkflow).toContain("npm run verify:metadata");
    expect(ciWorkflow).toContain("if: needs.changes.outputs.requires_full_ci == 'true'");
    expect(ciWorkflow).toContain("Build frontend");
    expect(ciWorkflow).toContain("Build Web Preview");
    expect(ciWorkflow).toContain("Web Preview QA");
    expect(ciWorkflow).toContain("npm run qa:web-preview");
    expect(ciWorkflow).toContain("paydance-web-preview-qa-*");
    expect(ciWorkflow).toContain("Upload Web Preview QA evidence");
    expect(ciWorkflow).toContain("Security audit");
    expect(ciWorkflow).toContain("Run Rust tests");
    expect(ciWorkflow).toContain("cargo test");

    expect(webPreviewWorkflow).toContain("Read CI change scope");
    expect(webPreviewWorkflow).toContain("actions/download-artifact");
    expect(webPreviewWorkflow).toContain("ci-change-scope");
    expect(webPreviewWorkflow).toContain("deploy_web_preview");
    expect(webPreviewWorkflow).toContain(
      "needs.scope.outputs.deploy_web_preview == 'true'",
    );
    expect(webPreviewWorkflow).toContain(
      "github.event.workflow_run.head_branch == 'main'",
    );
    expect(webPreviewWorkflow).toContain(
      "github.event.workflow_run.conclusion == 'success'",
    );
  });

  it("runs CodeQL, Windows executable smoke, and release SBOM generation", () => {
    const codeqlWorkflow = readRoot(".github/workflows/codeql.yml");
    const releaseWorkflow = readRoot(".github/workflows/release.yml");
    const smokeScript = readRoot("scripts/smoke-windows-exe.ps1");

    expect(codeqlWorkflow).toContain("github/codeql-action/init@");
    expect(codeqlWorkflow).toContain("github/codeql-action/analyze@");
    expect(codeqlWorkflow).toContain("javascript-typescript");
    expect(codeqlWorkflow).toContain("rust");
    expect(releaseWorkflow).toContain("Smoke test Windows executable");
    expect(releaseWorkflow).toContain("scripts/smoke-windows-exe.ps1");
    expect(releaseWorkflow).toContain("Generate release SBOM");
    expect(releaseWorkflow).toContain("pay-dance-sbom.spdx.json");
    expect(smokeScript).toContain("MainWindowHandle");
    expect(smokeScript).toContain("single-instance");
  });

  it("pins every GitHub Action to a full commit SHA", () => {
    const workflowFiles = [
      ".github/workflows/ci.yml",
      ".github/workflows/codeql.yml",
      ".github/workflows/post-release-smoke.yml",
      ".github/workflows/release.yml",
      ".github/workflows/web-preview.yml",
    ];

    for (const file of workflowFiles) {
      const source = readRoot(file);
      const actionRefs = [...source.matchAll(/uses:\s+[^@\s]+@([^\s#]+)/g)].map(
        (match) => match[1],
      );

      expect(actionRefs.length, file).toBeGreaterThan(0);
      for (const ref of actionRefs) {
        expect(ref, `${file}: ${ref}`).toMatch(/^[0-9a-f]{40}$/);
      }
    }
  });
});
