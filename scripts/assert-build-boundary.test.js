// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";

const scriptPath = resolve(import.meta.dirname, "assert-build-boundary.mjs");

const withDistFixture = (files, callback) => {
  const cwd = join(tmpdir(), `paydance-boundary-${process.pid}-${Date.now()}`);
  const assetsDir = join(cwd, "dist", "assets");
  mkdirSync(assetsDir, { recursive: true });

  for (const [name, content] of Object.entries(files)) {
    writeFileSync(join(assetsDir, name), content, "utf8");
  }

  try {
    return callback(cwd);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
};

describe("build boundary assertion", () => {
  it("rejects desktop chunks in the Web Preview build", () => {
    withDistFixture(
      {
        "index-web.js": "PayDance Web Preview",
        "DesktopApp-leak.js": "desktop code",
      },
      (cwd) => {
        expect(() =>
          execFileSync("node", [scriptPath, "web"], {
            cwd,
            encoding: "utf8",
            stdio: "pipe",
          }),
        ).toThrow(/DesktopApp-leak\.js/);
      },
    );
  });

  it("rejects web preview chunks in the desktop build", () => {
    withDistFixture(
      {
        "index-desktop.js": "tray-open-settings",
        "WebPreviewApp-leak.js": "web preview code",
      },
      (cwd) => {
        expect(() =>
          execFileSync("node", [scriptPath, "desktop"], {
            cwd,
            encoding: "utf8",
            stdio: "pipe",
          }),
        ).toThrow(/WebPreviewApp-leak\.js/);
      },
    );
  });
});
