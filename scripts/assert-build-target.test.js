// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const scriptPath = resolve(import.meta.dirname, "assert-build-target.mjs");

describe("build target assertion", () => {
  it("accepts a hashed multi-page entry that is not named index", () => {
    const cwd = join(tmpdir(), `paydance-target-${process.pid}-${Date.now()}`);
    const assetsDir = join(cwd, "dist", "assets");
    mkdirSync(assetsDir, { recursive: true });
    writeFileSync(
      join(cwd, "dist", "index.html"),
      '<script type="module" src="/PayDance/assets/main-example123.js"></script>',
      "utf8",
    );
    writeFileSync(join(assetsDir, "main-example123.js"), "PayDance Web Preview", "utf8");

    try {
      expect(
        execFileSync("node", [scriptPath, "web"], {
          cwd,
          encoding: "utf8",
          stdio: "pipe",
        }),
      ).toContain("web build entry includes web runtime");
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });
});
