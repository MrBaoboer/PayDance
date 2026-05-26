import { readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path) => readFileSync(resolve(import.meta.dirname, "..", path), "utf8");
const blockedAudienceTerms = [
  String.fromCodePoint(0x6253, 0x5de5),
  String.fromCodePoint(0x6253, 0x5de5, 0x4eba),
  String.fromCodePoint(0x6253, 0x5de5, 0x4eba, 0x7684),
];
const macOsName = ["mac", "OS"].join("");
const binaryExtensions = new Set([".ico", ".png", ".woff2"]);
const textFiles = [
  ".github/ISSUE_TEMPLATE.md",
  ".github/ISSUE_TEMPLATE/bug_report.yml",
  "CHANGELOG.md",
  "DESIGN.md",
  "LICENSE",
  "PRODUCT.md",
  "README.md",
  "package.json",
  "scripts/repository-metadata.test.js",
  "src-tauri/capabilities/desktop.json",
  "src/WebPreviewApp.vue",
  "src/web-preview.test.ts",
].filter((path) => !binaryExtensions.has(extname(path).toLowerCase()));

describe("repository metadata", () => {
  it("keeps issue template version hints aligned with the current release line", () => {
    expect(read(".github/ISSUE_TEMPLATE.md")).not.toContain("v0.8.9");
    expect(read(".github/ISSUE_TEMPLATE/bug_report.yml")).not.toContain("v0.8.9");
    expect(read(".github/ISSUE_TEMPLATE.md")).toContain("v0.8.10");
    expect(read(".github/ISSUE_TEMPLATE/bug_report.yml")).toContain("v0.8.10");
  });

  it("removes legacy audience and desktop migration wording from product text", () => {
    for (const file of textFiles) {
      const source = read(file);

      for (const term of blockedAudienceTerms) {
        expect(source, file).not.toContain(term);
      }

      expect(source, file).not.toContain(macOsName);
      expect(source, file).not.toContain(String.fromCodePoint(0x8fc1, 0x79fb));
    }
  });
});
