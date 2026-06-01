// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";

const scriptPath = resolve(import.meta.dirname, "release", "build-latest-json.mjs");

const runScript = (args) =>
  spawnSync("node", [scriptPath, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

describe("latest.json generation", () => {
  it("writes the updater signature from the required signature file", () => {
    const dir = mkdtempSync(join(tmpdir(), "paydance-latest-json-"));
    try {
      const sigPath = join(dir, "pay-dance.exe.sig");
      const notesPath = join(dir, "release-notes.md");
      writeFileSync(sigPath, "trusted-signature\n", "utf8");
      writeFileSync(notesPath, "Release notes\n", "utf8");

      const result = runScript([
        "--version",
        "0.9.3",
        "--sig-file",
        sigPath,
        "--notes-file",
        notesPath,
      ]);

      expect(result.status).toBe(0);
      const latestJson = JSON.parse(result.stdout);
      expect(latestJson.version).toBe("v0.9.3");
      expect(latestJson.notes).toBe("Release notes");
      expect(latestJson.platforms["windows-x86_64"].signature).toBe("trusted-signature");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("refuses to generate updater metadata without a non-empty signature", () => {
    const dir = mkdtempSync(join(tmpdir(), "paydance-latest-json-"));
    try {
      const emptySigPath = join(dir, "empty.sig");
      writeFileSync(emptySigPath, "", "utf8");

      const missingArg = runScript(["--version", "0.9.3"]);
      expect(missingArg.status).not.toBe(0);
      expect(missingArg.stderr).toContain("Missing required --sig-file argument");

      const emptyFile = runScript(["--version", "0.9.3", "--sig-file", emptySigPath]);
      expect(emptyFile.status).not.toBe(0);
      expect(emptyFile.stderr).toContain("Signature file is empty");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
