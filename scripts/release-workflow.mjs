// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

import packageMetadata from "../package.json" with { type: "json" };

const rootDir = resolve(import.meta.dirname, "..");
const repo = process.env.GITHUB_REPOSITORY || "MasterBao66/PayDance";
const mainBranch = "main";
const tagPattern = /^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const npmInvocation = resolveNpmInvocation();

const argv = process.argv.slice(2);
const args = new Set(argv);
const tag = readOption("--tag") ?? `v${packageMetadata.version}`;
const options = {
  dryRun: args.has("--dry-run"),
  noWatch: args.has("--no-watch"),
  skipCi: args.has("--skip-ci"),
};

function printUsage() {
  console.log(`Usage:
  npm run release:publish
  node scripts/release-workflow.mjs --tag v${packageMetadata.version}

Options:
  --tag <tag>  Release tag to publish. Defaults to v${packageMetadata.version}.
  --dry-run    Run local release readiness checks without creating or pushing a tag.
  --no-watch   Push the tag but do not wait for Release and Post-Release Smoke.
  --skip-ci    Skip local verification that CI and CodeQL already passed.`);
}

if (args.has("--help") || args.has("-h")) {
  printUsage();
  process.exit(0);
}

function readOption(name) {
  const index = argv.indexOf(name);
  if (index === -1) {
    return undefined;
  }
  return argv.at(index + 1);
}

function fail(message) {
  console.error(`\n[release-workflow] ${message}`);
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

function run(label, command, commandArgs, { cwd = rootDir, env = process.env } = {}) {
  console.log(`\n[release-workflow] ${label}`);
  const result = spawnSync(command, commandArgs, {
    cwd,
    env,
    stdio: "inherit",
  });

  if (result.error) {
    fail(`${label} could not start: ${result.error.message}`);
  }
  if (result.status !== 0) {
    fail(`${label} failed with exit code ${result.status}`);
  }
}

function capture(command, commandArgs, { cwd = rootDir, env = process.env } = {}) {
  const result = spawnSync(command, commandArgs, {
    cwd,
    env,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.error) {
    fail(`${command} ${commandArgs.join(" ")} could not start: ${result.error.message}`);
  }
  if (result.status !== 0) {
    const stderr = result.stderr.trim();
    fail(`${command} ${commandArgs.join(" ")} failed${stderr ? `:\n${stderr}` : ""}`);
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

function assertTagFormat(releaseTag) {
  if (!tagPattern.test(releaseTag)) {
    fail(`Invalid release tag: ${releaseTag}`);
  }
}

function assertMainBranch() {
  const branch = capture("git", ["rev-parse", "--abbrev-ref", "HEAD"]);
  if (branch !== mainBranch) {
    fail(`Refusing to release from '${branch}'. Switch to '${mainBranch}' first.`);
  }
}

function assertTrackedCleanWorktree() {
  const status = capture("git", ["status", "--short", "--untracked-files=no"]);
  if (status) {
    fail(`Tracked working tree changes must be committed before release:\n${status}`);
  }

  const untrackedFiles = splitLines(
    capture("git", ["status", "--short", "--untracked-files=normal"]),
  ).filter((line) => line.startsWith("?? "));
  if (untrackedFiles.length > 0) {
    console.log(
      [
        "\n[release-workflow] Untracked files are present. They will not be released:",
        ...untrackedFiles.map((line) => `  ${line}`),
      ].join("\n"),
    );
  }
}

function assertSyncedWithRemote() {
  run("fetch origin/main and tags", "git", ["fetch", "origin", mainBranch, "--tags"]);
  const behind = Number(
    capture("git", ["rev-list", "--count", `HEAD..origin/${mainBranch}`]),
  );
  const ahead = Number(
    capture("git", ["rev-list", "--count", `origin/${mainBranch}..HEAD`]),
  );

  if (behind > 0) {
    fail(`Local ${mainBranch} is ${behind} commit(s) behind origin/${mainBranch}.`);
  }
  if (ahead > 0) {
    fail(
      `Local ${mainBranch} is ${ahead} commit(s) ahead of origin/${mainBranch}. Run npm run push:main before releasing.`,
    );
  }
}

function assertVersionMetadata(releaseTag) {
  if (releaseTag !== `v${packageMetadata.version}`) {
    fail(
      `Release tag ${releaseTag} does not match package.json version v${packageMetadata.version}.`,
    );
  }

  for (const file of ["CHANGELOG.md", "CHANGELOG_EN.md"]) {
    const source = readFileSync(resolve(rootDir, file), "utf8");
    if (!source.includes(`### ${releaseTag}`)) {
      fail(`${file} does not contain a release section for ${releaseTag}.`);
    }
  }

  run("version consistency", npmInvocation.command, npmArgs("run", "version:check"), {
    env: { ...process.env, GITHUB_REF_NAME: releaseTag },
  });
  run("release lock check", npmInvocation.command, npmArgs("run", "release:check"));
}

function gitRefExists(commandArgs) {
  const result = spawnSync("git", commandArgs, {
    cwd: rootDir,
    env: process.env,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return result.status === 0;
}

function assertTagDoesNotExist(releaseTag) {
  if (gitRefExists(["rev-parse", "--verify", "--quiet", `refs/tags/${releaseTag}`])) {
    fail(`Local tag already exists: ${releaseTag}`);
  }
  if (
    gitRefExists([
      "ls-remote",
      "--exit-code",
      "--tags",
      "origin",
      `refs/tags/${releaseTag}`,
    ])
  ) {
    fail(`Remote tag already exists: ${releaseTag}`);
  }
}

function ensureGhAvailable() {
  const result = spawnSync("gh", ["auth", "status", "--hostname", "github.com"], {
    cwd: rootDir,
    env: process.env,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.status !== 0) {
    fail("GitHub CLI is not authenticated. Run `gh auth login` first.");
  }
}

async function waitForSuccessfulWorkflow(workflowName, headSha) {
  console.log(
    `\n[release-workflow] Verify CI passed on the release commit: ${workflowName}`,
  );
  for (let attempt = 1; attempt <= 30; attempt += 1) {
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
      "headSha,status,conclusion,url",
    ]);
    const passedRun = runs.find(
      (runInfo) =>
        runInfo.headSha === headSha &&
        runInfo.status === "completed" &&
        runInfo.conclusion === "success",
    );
    if (passedRun) {
      console.log(`[release-workflow] ${workflowName} passed: ${passedRun.url}`);
      return;
    }

    console.log(
      `[release-workflow] Waiting for successful ${workflowName} on ${headSha.slice(0, 7)} (${attempt}/30)`,
    );
    await delay(10_000);
  }

  fail(`No successful ${workflowName} run found for ${headSha}.`);
}

async function findWorkflowRun(workflowName, headSha, { createdAfter, headBranch } = {}) {
  const createdAfterMs = createdAfter ? Date.parse(createdAfter) : 0;

  for (let attempt = 1; attempt <= 60; attempt += 1) {
    const runs = captureJson("gh", [
      "run",
      "list",
      "--repo",
      repo,
      "--workflow",
      workflowName,
      "--limit",
      "30",
      "--json",
      "createdAt,databaseId,headBranch,headSha,number,status,conclusion,url",
    ]);
    const runInfo = runs.find(
      (item) =>
        item.headSha === headSha &&
        (!headBranch || item.headBranch === headBranch) &&
        (!createdAfterMs || Date.parse(item.createdAt) >= createdAfterMs),
    );
    if (runInfo) {
      return runInfo;
    }

    console.log(
      `[release-workflow] Waiting for ${workflowName} run for ${headSha.slice(0, 7)} (${attempt}/60)`,
    );
    await delay(5_000);
  }

  fail(`Timed out waiting for ${workflowName} run for ${headSha}.`);
}

async function watchWorkflow(workflowName, headSha, options = {}) {
  const runInfo = await findWorkflowRun(workflowName, headSha, options);
  console.log(
    `[release-workflow] Watching ${workflowName} #${runInfo.number}: ${runInfo.url}`,
  );
  run(`${workflowName} #${runInfo.number}`, "gh", [
    "run",
    "watch",
    String(runInfo.databaseId),
    "--repo",
    repo,
    "--exit-status",
  ]);
  return runInfo;
}

function assertReleaseAssets(releaseTag) {
  const version = releaseTag.replace(/^v/, "");
  const exe = `pay-dance-v${version}-windows-x64.exe`;
  const release = captureJson("gh", [
    "release",
    "view",
    releaseTag,
    "--repo",
    repo,
    "--json",
    "assets,tagName,url",
  ]);
  const assetNames = new Set(release.assets.map((asset) => asset.name));
  const requiredAssets = [
    exe,
    `${exe}.sha256`,
    `${exe}.sig`,
    "latest.json",
    "pay-dance-sbom.spdx.json",
    "release-manifest.json",
  ];
  const missing = requiredAssets.filter((asset) => !assetNames.has(asset));
  if (missing.length > 0) {
    fail(`Release ${releaseTag} is missing assets:\n${missing.join("\n")}`);
  }

  console.log(`[release-workflow] Release assets verified: ${release.url}`);
}

async function main() {
  assertTagFormat(tag);
  assertMainBranch();
  assertTrackedCleanWorktree();
  assertSyncedWithRemote();
  assertVersionMetadata(tag);
  assertTagDoesNotExist(tag);
  ensureGhAvailable();

  const headSha = capture("git", ["rev-parse", "HEAD"]);
  if (!options.skipCi) {
    await waitForSuccessfulWorkflow("CI", headSha);
    await waitForSuccessfulWorkflow("CodeQL", headSha);
  }

  if (options.dryRun) {
    console.log("\n[release-workflow] Dry run finished; no tag was created.");
    return;
  }

  run(`create annotated tag ${tag}`, "git", ["tag", "-a", tag, "-m", `Release ${tag}`]);
  run(`push tag ${tag}`, "git", ["push", "origin", tag]);

  if (!options.noWatch) {
    const releaseRun = await watchWorkflow("Release", headSha, { headBranch: tag });
    await watchWorkflow("Post-Release Smoke", headSha, {
      createdAfter: releaseRun.createdAt,
    });
    assertReleaseAssets(tag);
  }

  console.log(`\n[release-workflow] Release workflow finished for ${tag}.`);
}

await main();
