// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /ADDITIONAL_TERMS.md

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const script = readFileSync(
  resolve(import.meta.dirname, "setup-dev-encoding.ps1"),
  "utf8",
);
const editorConfig = readFileSync(
  resolve(import.meta.dirname, "..", ".editorconfig"),
  "utf8",
);

describe("development shell encoding setup", () => {
  it("configures PowerShell console and pipeline encoding to UTF-8", () => {
    expect(script).toContain("[Console]::InputEncoding");
    expect(script).toContain("[Console]::OutputEncoding");
    expect(script).toContain("$OutputEncoding");
    expect(script).toContain("chcp.com 65001");
  });

  it("sets safe UTF-8 defaults for common PowerShell file commands", () => {
    expect(script).toContain("Get-Content:Encoding");
    expect(script).toContain("Set-Content:Encoding");
    expect(script).toContain("Out-File:Encoding");
  });

  it("keeps source files declared as UTF-8 for editors", () => {
    expect(editorConfig).toContain("charset = utf-8");
    expect(editorConfig).toContain("insert_final_newline = true");
  });
});
