import { existsSync, readFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const scriptPath = resolve(import.meta.dirname, "extract-release-notes.mjs");
const outputPath = resolve(
  import.meta.dirname,
  "..",
  ".tmp-release-notes-test.md",
);

describe("release notes extraction", () => {
  it("builds GitHub Release notes from CHANGELOG.md", () => {
    if (existsSync(outputPath)) {
      rmSync(outputPath);
    }

    execFileSync(
      "node",
      [scriptPath, "--version", "v0.7.9", "--output", outputPath],
      { encoding: "utf8" },
    );

    const notes = readFileSync(outputPath, "utf8");
    const script = readFileSync(scriptPath, "utf8");

    expect(script).toContain("CHANGELOG.md");
    expect(notes).toContain("## PayDance v0.7.9");
    expect(notes).toContain("### Changes");
    expect(notes).toContain("### Download and verification");
    expect(notes).toContain("暗色模式");
    expect(notes).toContain("`.sha256`");
    expect(notes).not.toContain("This release was built by GitHub Actions");
    expect(notes).not.toMatch(/### Changes\r?\n\r?\n/);

    rmSync(outputPath);
  });
});
