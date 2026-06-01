// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(import.meta.dirname, "..");
const expectedVueHeader = [
  '<script setup lang="ts">',
  "// SPDX-FileCopyrightText: 2026 Mr.Baoboer",
  "// SPDX-License-Identifier: AGPL-3.0-only",
  "//",
  "// Additional terms: see /legal/ADDITIONAL_TERMS.md",
  "",
].join("\n");

const trackedFiles = () =>
  execFileSync("git", ["ls-files"], { cwd: repoRoot, encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean);

const readRoot = (path) =>
  readFileSync(resolve(repoRoot, path), "utf8").replace(/\r\n/g, "\n");

describe("source file license headers", () => {
  it("keeps Vue SFC SPDX headers in valid HTML comment form", () => {
    const vueFiles = trackedFiles().filter((file) => file.endsWith(".vue"));

    expect(vueFiles.length).toBeGreaterThan(0);

    for (const file of vueFiles) {
      const source = readRoot(file);
      const sourceBody = source.slice(expectedVueHeader.length);

      expect(source.startsWith(expectedVueHeader), file).toBe(true);
      expect(source, file).not.toMatch(
        /^\/\/ SPDX-FileCopyrightText:.*SPDX-License-Identifier:/m,
      );
      expect(source, file).not.toMatch(/^<!--\r?\nSPDX-FileCopyrightText:/m);
      expect(sourceBody, file).not.toMatch(/^Additional terms:/m);
    }
  });
});
