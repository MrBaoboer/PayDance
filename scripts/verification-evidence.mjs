// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const rootDir = resolve(import.meta.dirname, "..");
const defaultEvidencePath = resolve(rootDir, ".tmp", "paydance-verification.json");
const defaultMaxAgeMs = 2 * 60 * 60 * 1000;
const verificationStrength = new Map([
  ["verify:metadata", 1],
  ["verify:push", 2],
  ["verify:fast", 3],
  ["verify:release", 4],
]);

function currentHeadSha() {
  return execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: rootDir,
    encoding: "utf8",
  }).trim();
}

export function readVerificationEvidence({
  evidencePath = defaultEvidencePath,
  maxAgeMs = defaultMaxAgeMs,
} = {}) {
  if (!existsSync(evidencePath)) {
    return undefined;
  }

  try {
    const evidence = JSON.parse(readFileSync(evidencePath, "utf8"));
    const passedAtMs = Date.parse(evidence.passedAt ?? "");
    if (!Number.isFinite(passedAtMs)) {
      return undefined;
    }
    if (Date.now() - passedAtMs > maxAgeMs) {
      return undefined;
    }
    return evidence;
  } catch {
    return undefined;
  }
}

export function verificationEvidenceCovers(requiredCommand, headSha, evidence) {
  if (!evidence || evidence.status !== "success") {
    return false;
  }
  if (evidence.headSha !== headSha) {
    return false;
  }

  const requiredStrength =
    verificationStrength.get(requiredCommand) ?? Number.POSITIVE_INFINITY;
  const evidenceStrength = verificationStrength.get(evidence.command) ?? 0;
  return evidenceStrength >= requiredStrength;
}

export function writeVerificationEvidence(
  command,
  { evidencePath = defaultEvidencePath } = {},
) {
  if (!verificationStrength.has(command)) {
    throw new Error(`Unknown verification command: ${command}`);
  }

  const evidence = {
    command,
    status: "success",
    headSha: currentHeadSha(),
    passedAt: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
  };

  mkdirSync(dirname(evidencePath), { recursive: true });
  writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  return evidence;
}

function printUsage() {
  console.log(`Usage:
  node scripts/verification-evidence.mjs write verify:release

Commands:
  write <verification-command>  Record that a verification command passed for HEAD.`);
}

function cli(argv) {
  if (argv.includes("--help") || argv.includes("-h")) {
    printUsage();
    return;
  }

  const [action, command] = argv;
  if (action !== "write" || !command) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  const evidence = writeVerificationEvidence(command);
  console.log(
    `[verification-evidence] Recorded ${evidence.command} for ${evidence.headSha.slice(0, 7)}.`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    cli(process.argv.slice(2));
  } catch (error) {
    console.error(`[verification-evidence] ${error.message}`);
    process.exit(1);
  }
}
