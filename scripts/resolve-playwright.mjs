// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const scriptDir = dirname(fileURLToPath(import.meta.url));
const defaultProjectRoot = resolve(scriptDir, "..");

const formatError = (error) => (error instanceof Error ? error.message : String(error));

const isUsablePlaywright = (candidate) =>
  Boolean(candidate && typeof candidate === "object" && "chromium" in candidate);

export const getPlaywrightModuleDirs = ({
  env = process.env,
  homeDir = homedir(),
  projectRoot = defaultProjectRoot,
} = {}) =>
  [
    env.PLAYWRIGHT_NODE_MODULES,
    resolve(projectRoot, "node_modules"),
    env.CODEX_NODE_MODULES,
    join(
      homeDir,
      ".cache",
      "codex-runtimes",
      "codex-primary-runtime",
      "dependencies",
      "node",
      "node_modules",
    ),
  ].filter(Boolean);

export const resolvePlaywright = ({
  env = process.env,
  homeDir = homedir(),
  projectRoot = defaultProjectRoot,
  requireModule = require,
} = {}) => {
  const failures = [];

  for (const moduleDir of getPlaywrightModuleDirs({ env, homeDir, projectRoot })) {
    const packageDir = join(moduleDir, "playwright");
    if (!existsSync(packageDir)) continue;

    try {
      const candidate = requireModule(packageDir);
      if (!isUsablePlaywright(candidate)) {
        throw new Error("package did not expose chromium");
      }

      return candidate;
    } catch (error) {
      failures.push(`${packageDir}: ${formatError(error)}`);
    }
  }

  try {
    const candidate = requireModule("playwright");
    if (!isUsablePlaywright(candidate)) {
      throw new Error("package did not expose chromium");
    }

    return candidate;
  } catch (error) {
    failures.push(`playwright: ${formatError(error)}`);
  }

  throw new Error(
    [
      "Unable to load Playwright for Web Preview QA.",
      "Run npm install so the project-owned playwright devDependency is available.",
      "Failed candidates:",
      ...failures.map((failure) => `- ${failure}`),
    ].join("\n"),
  );
};
