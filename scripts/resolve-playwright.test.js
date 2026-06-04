// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { resolvePlaywright } from "./resolve-playwright.mjs";

const tempRoots = [];

const makeModuleRoot = (name) => {
  const root = mkdtempSync(join(tmpdir(), `paydance-${name}-`));
  tempRoots.push(root);
  mkdirSync(join(root, "node_modules", "playwright"), { recursive: true });
  return root;
};

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { force: true, recursive: true });
  }
});

describe("resolvePlaywright", () => {
  it("loads the project-owned Playwright before external runtime fallbacks", () => {
    const projectRoot = makeModuleRoot("project-playwright");
    const codexModules = join(makeModuleRoot("codex-playwright"), "node_modules");
    const projectModules = join(projectRoot, "node_modules");
    const projectPlaywright = { chromium: {}, source: "project" };

    const loaded = resolvePlaywright({
      env: {
        CODEX_NODE_MODULES: codexModules,
      },
      homeDir: join(projectRoot, "home"),
      projectRoot,
      requireModule: (packageDir) => {
        if (packageDir === join(projectModules, "playwright")) {
          return projectPlaywright;
        }

        throw new Error(`unexpected package load: ${packageDir}`);
      },
    });

    expect(loaded).toBe(projectPlaywright);
  });

  it("skips broken fallback packages and keeps trying later candidates", () => {
    const projectRoot = makeModuleRoot("project-playwright");
    const overrideModules = join(makeModuleRoot("override-playwright"), "node_modules");
    const projectModules = join(projectRoot, "node_modules");
    const projectPlaywright = { chromium: {}, source: "project" };

    const loaded = resolvePlaywright({
      env: {
        PLAYWRIGHT_NODE_MODULES: overrideModules,
      },
      homeDir: join(projectRoot, "home"),
      projectRoot,
      requireModule: (packageDir) => {
        if (packageDir === join(overrideModules, "playwright")) {
          throw new Error("Cannot find module 'playwright-core'");
        }

        if (packageDir === join(projectModules, "playwright")) {
          return projectPlaywright;
        }

        throw new Error(`unexpected package load: ${packageDir}`);
      },
    });

    expect(loaded).toBe(projectPlaywright);
  });

  it("reports all failed candidates when no usable Playwright can be loaded", () => {
    const projectRoot = makeModuleRoot("project-playwright");
    const overrideModules = join(makeModuleRoot("override-playwright"), "node_modules");

    expect(() =>
      resolvePlaywright({
        env: {
          PLAYWRIGHT_NODE_MODULES: overrideModules,
        },
        homeDir: join(projectRoot, "home"),
        projectRoot,
        requireModule: (packageDir) => {
          throw new Error(`load failed: ${packageDir}`);
        },
      }),
    ).toThrow(/Unable to load Playwright[\s\S]*npm install[\s\S]*load failed/);
  });
});
