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
    expect(pushWorkflow).toContain("--strict-untracked");
    expect(pushWorkflow).toContain("--untracked-files=no");
    expect(pushWorkflow).toContain("Untracked files are present");
    expect(pushWorkflow).toContain("readVerificationEvidence");
    expect(pushWorkflow).toContain("same HEAD");
    expect(pushWorkflow).not.toContain('"ls-files", "--others"');
    expect(pushWorkflow).not.toContain('"build:desktop"');
    expect(pushWorkflow).not.toContain('"build:web"');
    expect(pushWorkflow).toContain('watchWorkflow("CI"');
    expect(pushWorkflow).toContain('watchWorkflow("CodeQL"');
    expect(pushWorkflow).toContain('watchWorkflow("Web Preview"');
  });

  it("keeps CI path-sensitive and deploys Web Preview only after eligible main success", () => {
    const ciWorkflow = readRoot(".github/workflows/ci.yml");
    const webPreviewWorkflow = readRoot(".github/workflows/web-preview.yml");

    expect(ciWorkflow).toContain("Detect change scope");
    expect(ciWorkflow).toContain("node scripts/ci-change-scope.mjs");
    expect(ciWorkflow).toContain("ci-change-scope");
    expect(ciWorkflow).toContain("requires_full_ci");
    expect(ciWorkflow).toContain("requires_frontend");
    expect(ciWorkflow).toContain("requires_rust");
    expect(ciWorkflow).toContain("requires_web_preview_qa");
    expect(ciWorkflow).toContain("requires_security");
    expect(ciWorkflow).toContain("shared-key: paydance-ci-rust-windows");
    expect(ciWorkflow).toContain("add-job-id-key: false");
    expect(ciWorkflow).toContain("deploy_web_preview");
    expect(ciWorkflow).toContain("npm run verify:metadata");
    expect(ciWorkflow).toContain("name: Frontend lint, tests, and builds");
    expect(ciWorkflow).toContain("if: needs.changes.outputs.requires_frontend == 'true'");
    expect(ciWorkflow).toContain("Build frontend");
    expect(ciWorkflow).toContain("Build Web Preview");
    expect(ciWorkflow).toContain("name: Web Preview QA");
    expect(ciWorkflow).toContain(
      "if: needs.changes.outputs.requires_web_preview_qa == 'true'",
    );
    expect(ciWorkflow).toContain("Web Preview QA");
    expect(ciWorkflow).toContain("npm run qa:web-preview");
    expect(ciWorkflow).toContain("paydance-web-preview-qa-*");
    expect(ciWorkflow).toContain("Upload Web Preview QA evidence");
    expect(ciWorkflow).toContain("Security audit");
    expect(ciWorkflow).toContain("if: needs.changes.outputs.requires_security == 'true'");
    expect(ciWorkflow).toMatch(
      /- name: Audit all npm dependencies\r?\n\s+if: needs\.changes\.outputs\.requires_npm_audit == 'true'\r?\n\s+run: npm audit --audit-level=high(?:\r?\n|$)/,
    );
    expect(ciWorkflow).not.toMatch(/\bnpm audit\b[^\r\n]*(?:--omit(?:=|\s+)dev)\b/);
    expect(ciWorkflow).not.toMatch(/\bNPM_CONFIG_OMIT:\s*dev\b/);
    expect(ciWorkflow).toContain("name: Rust checks");
    expect(ciWorkflow).toContain("if: needs.changes.outputs.requires_rust == 'true'");
    expect(ciWorkflow).toContain("Run Rust tests");
    expect(ciWorkflow).toContain("cargo test");
    expect(ciWorkflow).toContain("name: CI gate");
    expect(ciWorkflow).toContain("if: always()");
    expect(ciWorkflow).toContain("needs.frontend.result");
    expect(ciWorkflow).toContain("needs.web_preview_qa.result");
    expect(ciWorkflow).toContain("needs.rust.result");
    expect(ciWorkflow).toContain("needs.security.result");

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

  // 一条 Rust 公告曾把只改 npm 的 Dependabot PR 拦红（RUSTSEC-2026-0285，2026-09）：
  // 审计结论只由各自锁文件决定，所以 npm / cargo 审计按清单裁剪，gitleaks 始终跑；
  // 新公告靠每日定时审计发现并落到 issue，而不是等下一条无关提交撞上。
  it("scopes dependency audits per ecosystem and reruns them on a schedule", () => {
    const ciWorkflow = readRoot(".github/workflows/ci.yml");

    expect(ciWorkflow).toMatch(/schedule:\r?\n\s+- cron: "[^"]+"/);
    expect(ciWorkflow).toContain('--event "${{ github.event_name }}"');
    expect(ciWorkflow).toContain("requires_npm_audit");
    expect(ciWorkflow).toContain("requires_cargo_audit");
    expect(ciWorkflow).toMatch(
      /- name: Install frontend dependencies\r?\n\s+if: needs\.changes\.outputs\.requires_npm_audit == 'true'\r?\n\s+run: npm ci/,
    );
    for (const step of [
      "Install cargo-audit (pre-built)",
      "Audit Rust dependencies",
      "Install cargo-deny (pre-built)",
      "Check Rust dependency licenses and sources",
    ]) {
      expect(ciWorkflow, step).toMatch(
        new RegExp(
          `- name: ${step.replaceAll("(", "\\(").replaceAll(")", "\\)")}\\r?\\n\\s+if: "!cancelled\\(\\) && needs\\.changes\\.outputs\\.requires_cargo_audit == 'true'"`,
        ),
      );
    }
    // gitleaks 不按生态裁剪。
    expect(ciWorkflow).toMatch(
      /- name: Run gitleaks \(detect secrets in git history\)\r?\n\s+if: "!cancelled\(\)"\r?\n/,
    );
    // 定时审计的结论写进 issue；issues: write 只给这一个 job。
    expect(ciWorkflow).toContain("Track scheduled audit result in an issue");
    expect(ciWorkflow).toContain(
      "if: \"!cancelled() && github.event_name == 'schedule'\"",
    );
    expect(ciWorkflow).toContain("gh issue create");
    expect(ciWorkflow).toContain("gh issue close");
    expect(ciWorkflow.match(/^\s+issues: write$/gm)).toHaveLength(1);
    expect(ciWorkflow).toMatch(/^permissions:\r?\n\s+contents: read\r?\n\r?\n/m);
  });

  // 商业 / OEM / 白标授权只有在权属链条完整时才成立，而无签署提交造成的
  // 授权失效是静默的。DCO 必须留在 PR 门禁上，不能退回成纯文档约定。
  it("gates pull requests on DCO sign-off without blocking maintainer pushes", () => {
    const ciWorkflow = readRoot(".github/workflows/ci.yml");

    expect(ciWorkflow).toContain("name: DCO sign-off");
    expect(ciWorkflow).toContain("if: github.event_name == 'pull_request'");
    expect(ciWorkflow).toContain("node scripts/check-dco.mjs");
    expect(ciWorkflow).toContain("fetch-depth: 0");
    expect(ciWorkflow).toContain("needs.dco.result");
    // push 事件里该 job 是 skipped，gate 必须放行，否则 main 永远红。
    expect(ciWorkflow).toContain('[ "$DCO_RESULT" != "skipped" ]');
    // 机器人豁免必须挂在 GitHub 侧的 PR 作者上：提交里的作者字段谁都能伪造。
    expect(ciWorkflow).toContain("github.event.pull_request.user.login");
    expect(ciWorkflow).toContain('--pr-author "$PR_AUTHOR"');
  });

  it("does not cancel main validation or deployment runs", () => {
    const ciWorkflow = readRoot(".github/workflows/ci.yml");
    const codeqlWorkflow = readRoot(".github/workflows/codeql.yml");
    const webPreviewWorkflow = readRoot(".github/workflows/web-preview.yml");

    expect(ciWorkflow).toContain(
      "cancel-in-progress: ${{ github.event_name == 'pull_request' }}",
    );
    expect(ciWorkflow).not.toContain("cancel-in-progress: true");
    expect(codeqlWorkflow).toContain(
      "cancel-in-progress: ${{ github.event_name == 'pull_request' }}",
    );
    expect(codeqlWorkflow).not.toContain("cancel-in-progress: true");
    expect(webPreviewWorkflow).toContain("cancel-in-progress: false");
  });

  it("runs CodeQL, Windows executable smoke, and release SBOM generation", () => {
    const codeqlWorkflow = readRoot(".github/workflows/codeql.yml");
    const releaseWorkflow = readRoot(".github/workflows/release.yml");
    const smokeScript = readRoot("scripts/smoke-windows-exe.ps1");

    expect(codeqlWorkflow).toContain("github/codeql-action/init@");
    expect(codeqlWorkflow).toContain("github/codeql-action/analyze@");
    expect(codeqlWorkflow).toContain("javascript-typescript");
    expect(codeqlWorkflow).toContain("rust");
    expect(codeqlWorkflow).toContain("Detect CodeQL change scope");
    expect(codeqlWorkflow).toContain("node scripts/ci-change-scope.mjs");
    expect(codeqlWorkflow).toContain("requires_codeql");
    expect(codeqlWorkflow).toContain("needs.changes.outputs.requires_codeql");
    expect(codeqlWorkflow).toContain("github.event_name == 'schedule'");
    expect(codeqlWorkflow).toContain("name: CodeQL gate");
    expect(codeqlWorkflow).toContain("needs.changes.result");
    expect(codeqlWorkflow).toContain("needs.analyze.result");
    expect(codeqlWorkflow).toContain('[ "$ANALYZE_RESULT" != "skipped" ]');
    expect(releaseWorkflow).toContain("Smoke test Windows executable");
    expect(releaseWorkflow).toContain("scripts/smoke-windows-exe.ps1");
    expect(releaseWorkflow).toContain("Generate release SBOM");
    expect(releaseWorkflow).toContain("shared-key: paydance-release-rust-windows");
    expect(releaseWorkflow).toContain("add-job-id-key: false");
    expect(releaseWorkflow).toContain("Generate release manifest");
    expect(releaseWorkflow).toContain("release-manifest.json");
    expect(releaseWorkflow).toContain("Get-AuthenticodeSignature");
    expect(releaseWorkflow).toContain("pay-dance-sbom.spdx.json");
    expect(smokeScript).toContain("MainWindowHandle");
    expect(smokeScript).toContain("single-instance");
    expect(smokeScript).toContain("[string]$ReportPath");
    expect(smokeScript).toContain("ConvertTo-Json");
    expect(smokeScript).toContain("Responding");
    expect(releaseWorkflow).toContain("paydance-exe-smoke-report.json");
  });

  it("pins every GitHub Action to a full commit SHA", () => {
    const workflowFiles = [
      ".github/workflows/ci.yml",
      ".github/workflows/codeql.yml",
      ".github/workflows/post-release-smoke.yml",
      ".github/workflows/release.yml",
      ".github/workflows/usage-snapshot.yml",
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
