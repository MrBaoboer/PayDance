// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

import { classifyChangedFiles } from "./ci-change-scope.mjs";
import {
  readVerificationEvidence,
  verificationEvidenceCovers,
} from "./verification-evidence.mjs";

const rootDir = resolve(import.meta.dirname, "..");
const args = new Set(process.argv.slice(2));
const repo = process.env.GITHUB_REPOSITORY || "MrBaoboer/PayDance";
const mainBranch = "main";

const npmInvocation = resolveNpmInvocation();

const options = {
  noPush: args.has("--no-push") || args.has("--verify-only"),
  noWatch: args.has("--no-watch") || args.has("--verify-only"),
  skipDependabot: args.has("--skip-dependabot") || args.has("--verify-only"),
  skipVerify: args.has("--skip-verify"),
  strictUntracked: args.has("--strict-untracked"),
  verifyOnly: args.has("--verify-only"),
};

function printUsage() {
  console.log(`Usage:
  npm run verify:push
  npm run push:main

Options:
  --verify-only       Run local push-readiness checks only.
  --skip-verify      Push and watch without rerunning local checks.
  --no-push          Run checks but do not push.
  --no-watch         Push without waiting for GitHub Actions.
  --skip-dependabot  Skip GitHub Dependabot open-alert checks.
  --strict-untracked Treat untracked files as a blocking dirty worktree.`);
}

if (args.has("--help") || args.has("-h")) {
  printUsage();
  process.exit(0);
}

function fail(message) {
  console.error(`\n[push-workflow] ${message}`);
  process.exit(1);
}

function resolveNpmInvocation() {
  const npmCliCandidates = [
    process.env.npm_execpath,
    join(dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js"),
  ].filter(Boolean);
  const npmCliPath = npmCliCandidates.find((candidate) => existsSync(candidate));

  if (npmCliPath) {
    return {
      command: process.execPath,
      prefixArgs: [npmCliPath],
    };
  }

  return {
    command: "npm",
    prefixArgs: [],
  };
}

function npmArgs(...commandArgs) {
  return [...npmInvocation.prefixArgs, ...commandArgs];
}

function run(label, command, commandArgs, { cwd = rootDir, optionalHint } = {}) {
  console.log(`\n[push-workflow] ${label}`);
  const result = spawnSync(command, commandArgs, {
    cwd,
    env: process.env,
    stdio: "inherit",
  });

  if (result.error) {
    fail(`${label} could not start: ${result.error.message}${optionalHint ?? ""}`);
  }
  if (result.status !== 0) {
    fail(`${label} failed with exit code ${result.status}${optionalHint ?? ""}`);
  }
}

function capture(command, commandArgs, { cwd = rootDir, optionalHint } = {}) {
  const result = spawnSync(command, commandArgs, {
    cwd,
    env: process.env,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.error) {
    fail(
      `${command} ${commandArgs.join(" ")} could not start: ${result.error.message}${optionalHint ?? ""}`,
    );
  }
  if (result.status !== 0) {
    const stderr = result.stderr.trim();
    fail(
      `${command} ${commandArgs.join(" ")} failed${stderr ? `:\n${stderr}` : ""}${optionalHint ?? ""}`,
    );
  }
  return result.stdout.trim();
}

function captureJson(command, commandArgs, options = {}) {
  const output = capture(command, commandArgs, options);
  try {
    return JSON.parse(output);
  } catch (error) {
    fail(
      `Expected JSON from ${command} ${commandArgs.join(" ")} but got:\n${output}\n${error.message}`,
    );
  }
}

function splitLines(output) {
  return output.split(/\r?\n/).filter(Boolean);
}

function ensureGhAvailable() {
  const result = spawnSync("gh", ["auth", "status", "--hostname", "github.com"], {
    cwd: rootDir,
    env: process.env,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.status !== 0) {
    fail(
      "GitHub CLI is not authenticated. Run `gh auth login` before using `npm run push:main`.",
    );
  }
}

function assertCleanWorktree() {
  const trackedStatus = capture("git", ["status", "--short", "--untracked-files=no"]);
  if (trackedStatus) {
    fail(
      `Tracked working tree changes must be committed or stashed before pushing:\n${trackedStatus}`,
    );
  }

  const untrackedStatus = capture("git", [
    "status",
    "--short",
    "--untracked-files=normal",
  ]);
  const untrackedFiles = splitLines(untrackedStatus).filter((line) =>
    line.startsWith("?? "),
  );

  if (untrackedFiles.length === 0) {
    return;
  }

  const message = [
    "Untracked files are present. They will not be pushed and will not affect change-scope detection:",
    ...untrackedFiles.map((line) => `  ${line}`),
    "Use --strict-untracked if you want untracked files to block this workflow.",
  ].join("\n");

  if (options.strictUntracked) {
    fail(message);
  }

  console.log(`\n[push-workflow] ${message}`);
}

function assertMainBranch() {
  const branch = capture("git", ["rev-parse", "--abbrev-ref", "HEAD"]);
  if (branch !== mainBranch) {
    fail(
      `Refusing to push from '${branch}'. Switch to '${mainBranch}' or push the branch manually.`,
    );
  }
}

function assertNotBehindRemote() {
  run("fetch origin/main", "git", ["fetch", "origin", mainBranch]);
  const behind = Number(
    capture("git", ["rev-list", "--count", `HEAD..origin/${mainBranch}`]),
  );
  if (behind > 0) {
    fail(
      `Local ${mainBranch} is ${behind} commit(s) behind origin/${mainBranch}. Pull or rebase first.`,
    );
  }
}

function localChangedFiles() {
  const remoteRef = `origin/${mainBranch}`;

  return [
    ...splitLines(capture("git", ["diff", "--name-only", `${remoteRef}..HEAD`, "--"])),
    ...splitLines(capture("git", ["diff", "--name-only", "--cached", "--"])),
    ...splitLines(capture("git", ["diff", "--name-only", "--"])),
  ];
}

function resolveLocalChangeScope() {
  const scope = classifyChangedFiles(localChangedFiles());

  console.log(`\n[push-workflow] Local change scope: ${scope.scope}`);
  console.log(`[push-workflow] Changed files: ${scope.changedFiles.length}`);
  for (const reason of scope.reasons) {
    console.log(`[push-workflow] ${reason}`);
  }

  return scope;
}

function hasTrackedWorkingChanges() {
  return Boolean(capture("git", ["status", "--short", "--untracked-files=no"]).trim());
}

function verifyLocalReadiness(scope, headSha) {
  const requiredCommand = scope.requiresFullCi ? "verify:push" : "verify:metadata";
  const evidence = readVerificationEvidence();

  if (
    !hasTrackedWorkingChanges() &&
    verificationEvidenceCovers(requiredCommand, headSha, evidence)
  ) {
    console.log(
      `\n[push-workflow] Skipping local verification because ${evidence.command} already passed for the same HEAD (${headSha.slice(0, 7)}).`,
    );
    return;
  }

  // Keep git whitespace validation in verify:metadata via `git diff --check`.
  // Legacy metadata guard: "diff", "--check".
  run("metadata verification", npmInvocation.command, npmArgs("run", "verify:metadata"));

  if (!scope.requiresFullCi) {
    console.log(
      "\n[push-workflow] Lightweight change detected; metadata checks are sufficient locally.",
    );
    return;
  }

  console.log(
    "\n[push-workflow] Fast daily checks: lint and unit tests run locally; GitHub CI handles builds, browser QA, Rust checks, and security audits.",
  );
  const steps = [
    ["lint", npmInvocation.command, npmArgs("run", "lint"), rootDir],
    ["unit tests", npmInvocation.command, npmArgs("test"), rootDir],
  ];

  for (const [label, command, commandArgs, cwd] of steps) {
    run(label, command, commandArgs, { cwd });
  }
}

function assertNoOpenDependabotAlerts(stage) {
  const alerts = captureJson("gh", [
    "api",
    "-X",
    "GET",
    `repos/${repo}/dependabot/alerts`,
    "-f",
    "state=open",
  ]);

  if (alerts.length > 0) {
    const summary = alerts
      .map(
        (alert) =>
          `#${alert.number} ${alert.dependency?.package?.name ?? "unknown"} (${alert.security_advisory?.severity ?? "unknown"})`,
      )
      .join("\n");
    fail(`Open Dependabot alerts found ${stage}:\n${summary}`);
  }

  console.log(`[push-workflow] Dependabot open alerts ${stage}: 0`);
}

async function findWorkflowRun(workflowName, headSha) {
  for (let attempt = 1; attempt <= 40; attempt += 1) {
    const runs = captureJson("gh", [
      "run",
      "list",
      "--repo",
      repo,
      "--workflow",
      workflowName,
      "--limit",
      "20",
      "--json",
      "databaseId,headSha,number,status,conclusion,url",
    ]);
    const runInfo = runs.find((runItem) => runItem.headSha === headSha);
    if (runInfo) {
      return runInfo;
    }
    console.log(
      `[push-workflow] Waiting for ${workflowName} run for ${headSha.slice(0, 7)} (${attempt}/40)`,
    );
    await delay(5_000);
  }

  fail(`Timed out waiting for ${workflowName} run for ${headSha}.`);
}

async function watchWorkflow(workflowName, headSha) {
  const runInfo = await findWorkflowRun(workflowName, headSha);
  console.log(
    `[push-workflow] Watching ${workflowName} #${runInfo.number}: ${runInfo.url}`,
  );
  run(`${workflowName} #${runInfo.number}`, "gh", [
    "run",
    "watch",
    String(runInfo.databaseId),
    "--repo",
    repo,
    "--exit-status",
  ]);
}

async function main() {
  if (!options.verifyOnly) {
    assertCleanWorktree();
    assertMainBranch();
  }

  assertNotBehindRemote();
  const scope = resolveLocalChangeScope();
  const headSha = capture("git", ["rev-parse", "HEAD"]);

  if (!options.skipVerify) {
    verifyLocalReadiness(scope, headSha);
  }

  if (options.verifyOnly) {
    console.log("\n[push-workflow] Local push-readiness verification finished.");
    return;
  }

  if (!options.noPush || !options.noWatch || !options.skipDependabot) {
    ensureGhAvailable();
  }

  if (!options.skipDependabot) {
    assertNoOpenDependabotAlerts("before push");
  }

  if (!options.noPush) {
    run("push origin/main", "git", ["push", "origin", mainBranch]);
  }

  if (!options.noWatch) {
    await watchWorkflow("CI", headSha);
    await watchWorkflow("CodeQL", headSha);
    if (scope.deployWebPreview) {
      await watchWorkflow("Web Preview", headSha);
    } else {
      console.log(
        "\n[push-workflow] Skipping Web Preview watch because this change scope does not deploy it.",
      );
    }
  }

  if (!options.skipDependabot) {
    assertNoOpenDependabotAlerts("after push");
  }

  console.log("\n[push-workflow] Push workflow finished.");
}

await main();
