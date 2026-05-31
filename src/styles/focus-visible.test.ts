// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /ADDITIONAL_TERMS.md

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const styleSource = readFileSync(new URL("../style.css", import.meta.url), "utf8");

describe("global focus styles", () => {
  it("provides a visible keyboard focus ring for interactive controls", () => {
    expect(styleSource).toContain(":focus-visible");
    expect(styleSource).toContain("outline:");
    expect(styleSource).toContain("--focus-ring");
    expect(styleSource).toContain(':where(button, [role="button"]):focus-visible');
    expect(styleSource).not.toContain('button, input, [role="button"]');
  });
});
