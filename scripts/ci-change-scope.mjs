// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { appendFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const ZERO_SHA = /^0+$/;
const ROOT_LIGHTWEIGHT_FILE =
  /^(README|LICENSE|SECURITY|CONTRIBUTING|CHANGELOG|PRODUCT|DESIGN|CODE_OF_CONDUCT|SUPPORT)(?:[._-].*)?$/i;
const WEB_PREVIEW_WORKFLOW = ".github/workflows/web-preview.yml";
const SHARED_CI_WORKFLOW = ".github/workflows/ci.yml";
const RELEASE_WORKFLOW = ".github/workflows/release.yml";
const CODEQL_WORKFLOW = ".github/workflows/codeql.yml";
const POST_RELEASE_SMOKE_WORKFLOW = ".github/workflows/post-release-smoke.yml";

function normalizeChangedFile(file) {
  return file.trim().replaceAll("\\", "/").replace(/^\.\//, "");
}

function uniqueNormalizedFiles(files) {
  return [...new Set(files.map(normalizeChangedFile).filter(Boolean))].sort();
}

function commitExists(ref) {
  try {
    execFileSync("git", ["cat-file", "-e", `${ref}^{commit}`], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function isLightweightFile(file) {
  if (ROOT_LIGHTWEIGHT_FILE.test(file)) {
    return true;
  }

  return (
    file.startsWith("docs/") ||
    file.startsWith("legal/") ||
    file === ".github/CONTRIBUTING.md" ||
    file === ".github/ISSUE_TEMPLATE.md" ||
    file.startsWith(".github/ISSUE_TEMPLATE/") ||
    file === ".github/PULL_REQUEST_TEMPLATE.md" ||
    file === ".github/SECURITY.md"
  );
}

function affectsWebPreview(file) {
  return (
    file.startsWith("src/") ||
    file.startsWith("en/") ||
    file.startsWith("public/") ||
    file === "index.html" ||
    file === "scripts/web-seo.mjs" ||
    file === "package.json" ||
    file === "package-lock.json" ||
    file === "npm-shrinkwrap.json" ||
    file.startsWith("vite.config.") ||
    file.startsWith("tsconfig") ||
    file.startsWith("tailwind.config.") ||
    file === WEB_PREVIEW_WORKFLOW
  );
}

function affectsFrontend(file) {
  return (
    affectsWebPreview(file) ||
    file === SHARED_CI_WORKFLOW ||
    file === "scripts/assert-build-target.mjs" ||
    file === "scripts/assert-build-boundary.mjs" ||
    file === "scripts/qa-web-preview.mjs" ||
    file === "scripts/resolve-playwright.mjs"
  );
}

function affectsRust(file) {
  return file.startsWith("src-tauri/") || file === SHARED_CI_WORKFLOW;
}

// npm 与 cargo 的审计只在各自清单变化时跑：审计结果只由锁文件决定，改 npm 的 PR
// 上跑 cargo audit 得到的和 main 一样，却会被一条 Rust 公告拦下。gitleaks 扫整个历史，
// 任何安全相关文件变化都跑。
function affectsNpmAudit(file) {
  return (
    file === "package.json" ||
    file === "package-lock.json" ||
    file === "npm-shrinkwrap.json" ||
    file === SHARED_CI_WORKFLOW
  );
}

function affectsCargoAudit(file) {
  return (
    file === "src-tauri/Cargo.toml" ||
    file === "src-tauri/Cargo.lock" ||
    file === "src-tauri/deny.toml" ||
    file === "src-tauri/.cargo/audit.toml" ||
    file === SHARED_CI_WORKFLOW
  );
}

function affectsSecurity(file) {
  return (
    affectsNpmAudit(file) ||
    affectsCargoAudit(file) ||
    file === ".gitleaks.toml" ||
    file === ".github/dependabot.yml" ||
    file === RELEASE_WORKFLOW ||
    file === CODEQL_WORKFLOW ||
    file === POST_RELEASE_SMOKE_WORKFLOW
  );
}

function affectsCodeql(file) {
  return (
    file.startsWith("src/") ||
    file.startsWith("src-tauri/") ||
    file.startsWith("scripts/") ||
    file.startsWith("vite.config.") ||
    file.startsWith("tsconfig") ||
    file === CODEQL_WORKFLOW
  );
}

function isKnownFullCiFile(file) {
  return (
    affectsFrontend(file) ||
    affectsRust(file) ||
    affectsSecurity(file) ||
    affectsCodeql(file) ||
    file.startsWith("scripts/")
  );
}

export function classifyChangedFiles(files) {
  const changedFiles = uniqueNormalizedFiles(files);

  if (changedFiles.length === 0) {
    return {
      changedFiles,
      scope: "full",
      isLightweight: false,
      requiresFullCi: true,
      requiresWindowsBuild: true,
      requiresFrontend: true,
      requiresRust: true,
      requiresWebPreviewQa: true,
      requiresSecurity: true,
      requiresNpmAudit: true,
      requiresCargoAudit: true,
      requiresCodeql: true,
      deployWebPreview: true,
      reasons: ["no changed files detected"],
    };
  }

  const fullCiFiles = changedFiles.filter((file) => !isLightweightFile(file));
  const requiresFullCi = fullCiFiles.length > 0;
  const unknownFullCiFiles = fullCiFiles.filter((file) => !isKnownFullCiFile(file));
  const failClosed = unknownFullCiFiles.length > 0;
  const requiresFrontend =
    requiresFullCi && (failClosed || changedFiles.some(affectsFrontend));
  const requiresRust = requiresFullCi && (failClosed || changedFiles.some(affectsRust));
  const requiresWebPreviewQa =
    requiresFullCi && (failClosed || changedFiles.some(affectsWebPreview));
  const requiresSecurity =
    requiresFullCi && (failClosed || changedFiles.some(affectsSecurity));
  const requiresNpmAudit =
    requiresFullCi && (failClosed || changedFiles.some(affectsNpmAudit));
  const requiresCargoAudit =
    requiresFullCi && (failClosed || changedFiles.some(affectsCargoAudit));
  const requiresCodeql =
    requiresFullCi && (failClosed || changedFiles.some(affectsCodeql));

  return {
    changedFiles,
    scope: requiresFullCi ? "full" : "lightweight",
    isLightweight: !requiresFullCi,
    requiresFullCi,
    requiresWindowsBuild: requiresFrontend || requiresRust || requiresWebPreviewQa,
    requiresFrontend,
    requiresRust,
    requiresWebPreviewQa,
    requiresSecurity,
    requiresNpmAudit,
    requiresCargoAudit,
    requiresCodeql,
    deployWebPreview: requiresWebPreviewQa,
    reasons: requiresFullCi
      ? fullCiFiles.map((file) => `requires full CI: ${file}`)
      : ["all changed files are lightweight"],
  };
}

// 定时审计不看改动：公告随时会发布，只有按时重跑审计才能在它拦住下一条无关
// 提交或 Dependabot PR 之前发现。除 security 之外的 job 全部跳过。
export function scheduledAuditScope() {
  return {
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
  };
}

function printUsage() {
  console.log(`Usage:
  node scripts/ci-change-scope.mjs --files README.md legal/ADDITIONAL_TERMS.md
  node scripts/ci-change-scope.mjs --base <base-sha> --head <head-sha>
  node scripts/ci-change-scope.mjs --event schedule

Options:
  --files <paths...>          Classify the provided file paths.
  --base <sha> --head <sha>   Classify files changed between two Git revisions.
  --event <name>              GitHub event name; "schedule" selects the audit-only scope.
  --github-output <path>      Append GitHub Actions output variables.
  --json-file <path>          Write the full JSON summary.
  --help                      Show this message.`);
}

function parseArgs(argv) {
  const parsed = {
    files: [],
    base: undefined,
    head: undefined,
    event: undefined,
    githubOutput: undefined,
    jsonFile: undefined,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
      continue;
    }
    if (arg === "--base") {
      parsed.base = argv.at(index + 1);
      index += 1;
      continue;
    }
    if (arg === "--head") {
      parsed.head = argv.at(index + 1);
      index += 1;
      continue;
    }
    if (arg === "--event") {
      parsed.event = argv.at(index + 1);
      index += 1;
      continue;
    }
    if (arg === "--github-output") {
      parsed.githubOutput = argv.at(index + 1);
      index += 1;
      continue;
    }
    if (arg === "--json-file") {
      parsed.jsonFile = argv.at(index + 1);
      index += 1;
      continue;
    }
    if (arg === "--files") {
      while (argv[index + 1] && !argv[index + 1].startsWith("--")) {
        parsed.files.push(argv[index + 1]);
        index += 1;
      }
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return parsed;
}

function gitFilesForRange(base, head) {
  const gitArgs =
    base && !ZERO_SHA.test(base) && commitExists(base)
      ? ["diff", "--name-only", base, head, "--"]
      : ["ls-tree", "-r", "--name-only", head];

  return execFileSync("git", gitArgs, { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean);
}

function writeGithubOutput(path, result) {
  appendFileSync(
    path,
    [
      `scope=${result.scope}`,
      `is_lightweight=${result.isLightweight}`,
      `requires_full_ci=${result.requiresFullCi}`,
      `requires_windows_build=${result.requiresWindowsBuild}`,
      `requires_frontend=${result.requiresFrontend}`,
      `requires_rust=${result.requiresRust}`,
      `requires_web_preview_qa=${result.requiresWebPreviewQa}`,
      `requires_security=${result.requiresSecurity}`,
      `requires_npm_audit=${result.requiresNpmAudit}`,
      `requires_cargo_audit=${result.requiresCargoAudit}`,
      `requires_codeql=${result.requiresCodeql}`,
      `deploy_web_preview=${result.deployWebPreview}`,
      `changed_count=${result.changedFiles.length}`,
      "",
    ].join("\n"),
    "utf8",
  );
}

function cli(argv) {
  const args = parseArgs(argv);

  if (args.help) {
    printUsage();
    return;
  }

  const result =
    args.event === "schedule"
      ? scheduledAuditScope()
      : classifyChangedFiles(
          args.files.length > 0
            ? args.files
            : gitFilesForRange(args.base, args.head ?? "HEAD"),
        );

  if (args.githubOutput) {
    writeGithubOutput(args.githubOutput, result);
  }
  if (args.jsonFile) {
    writeFileSync(args.jsonFile, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  }

  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    cli(process.argv.slice(2));
  } catch (error) {
    console.error(`[ci-change-scope] ${error.message}`);
    process.exit(1);
  }
}
