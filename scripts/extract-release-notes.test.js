// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const scriptPath = resolve(import.meta.dirname, "extract-release-notes.mjs");
// Written outside the repository so a failing run never leaves an untracked file behind.
const outputPath = join(
  mkdtempSync(join(tmpdir(), "paydance-release-notes-")),
  "notes.md",
);

describe("release notes extraction", () => {
  it("builds GitHub Release notes from CHANGELOG.md", () => {
    if (existsSync(outputPath)) {
      rmSync(outputPath);
    }

    execFileSync("node", [scriptPath, "--version", "v0.7.9", "--output", outputPath], {
      encoding: "utf8",
    });

    const notes = readFileSync(outputPath, "utf8");
    const script = readFileSync(scriptPath, "utf8");

    expect(script).toContain("CHANGELOG.md");
    expect(notes).toContain("## PayDance v0.7.9");
    expect(notes).toContain("### Changes");
    expect(notes).toContain("### Download and verification");
    expect(notes).toContain("暗色模式");
    expect(notes).toContain("`.sha256`");
    expect(notes).toContain("SmartScreen");
    expect(notes).toContain("docs/FAQ.md");
    expect(notes).not.toContain("This release was built by GitHub Actions");
    expect(notes).not.toMatch(/### Changes\r?\n\r?\n/);

    rmSync(outputPath);
  });
});
