// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /ADDITIONAL_TERMS.md

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(import.meta.dirname, "..");

const readWorkflow = (name) =>
  readFileSync(resolve(repoRoot, ".github", "workflows", name), "utf8");

describe("github actions rust cache", () => {
  it.each(["ci.yml", "release.yml"])(
    "caches the Rust target directory in %s",
    (workflowName) => {
      const workflow = readWorkflow(workflowName);

      expect(workflow).toContain("uses: Swatinem/rust-cache@v2");
      expect(workflow).toContain("workspaces: src-tauri -> target");
      expect(workflow).toContain("cache-on-failure: true");
    },
  );
});
