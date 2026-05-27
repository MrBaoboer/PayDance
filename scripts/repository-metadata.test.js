import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { extname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path) => readFileSync(resolve(import.meta.dirname, "..", path), "utf8");
const packageJson = JSON.parse(read("package.json"));
const versionedDesktopAssetName = `pay-dance-v${packageJson.version}-windows-x64.exe`;
const versionedDesktopChecksumName = `${versionedDesktopAssetName}.sha256`;
const desktopDownloadUrl = `https://github.com/MasterBao66/PayDance/releases/latest/download/${versionedDesktopAssetName}`;
const blockedAudienceTerms = [
  String.fromCodePoint(0x6253, 0x5de5),
  String.fromCodePoint(0x6253, 0x5de5, 0x4eba),
  String.fromCodePoint(0x6253, 0x5de5, 0x4eba, 0x7684),
];
const macOsName = ["mac", "OS"].join("");
const blockedDashboardTerm = String.fromCodePoint(0x4eea, 0x8868, 0x76d8);
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
const trackedTextFiles = () =>
  execFileSync("git", ["ls-files"], {
    cwd: resolve(import.meta.dirname, ".."),
    encoding: "utf8",
  })
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((path) => !binaryExtensions.has(extname(path).toLowerCase()));

describe("repository metadata", () => {
  it("keeps README desktop download links on the versioned Windows release executable", () => {
    const readme = read("README.md");
    const desktopDownloadLinks = readme.match(
      new RegExp(
        `https://github\\.com/MasterBao66/PayDance/releases/latest/download/${versionedDesktopAssetName}`,
        "g",
      ),
    );

    expect(desktopDownloadLinks?.length).toBeGreaterThanOrEqual(2);
    expect(readme).toContain(desktopDownloadUrl);
    expect(readme).toContain(versionedDesktopAssetName);
    expect(readme).toContain(versionedDesktopChecksumName);
    expect(read("src/lib/app-meta.ts")).toContain("windowsDownloadAssetName");
    expect(readme).not.toContain("releases/download/v0.7.16/pay-dance.exe");
    expect(readme).not.toContain("masterbao66.github.io/PayDance/pay-dance.exe");
  });

  it("publishes versioned Windows release assets from the release workflow", () => {
    const releaseWorkflow = read(".github/workflows/release.yml");

    expect(releaseWorkflow).toContain("pay-dance-v$version-windows-x64.exe");
    expect(releaseWorkflow).toContain("$assetPath.sha256");
    expect(releaseWorkflow).toContain("pay-dance-v");
    expect(releaseWorkflow).toContain("windows-x64");
    expect(releaseWorkflow).not.toContain("pay-dance.exe.sha256");
  });

  it("keeps issue template version hints aligned with the current release line", () => {
    expect(read(".github/ISSUE_TEMPLATE.md")).not.toContain("v0.8.14");
    expect(read(".github/ISSUE_TEMPLATE/bug_report.yml")).not.toContain("v0.8.14");
    expect(read(".github/ISSUE_TEMPLATE.md")).toContain("v0.8.15");
    expect(read(".github/ISSUE_TEMPLATE/bug_report.yml")).toContain("v0.8.15");
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

  it("keeps product positioning on the real-time desktop wage board wording", () => {
    const positioning = "桌面实时工资看板";

    expect(read("README.md")).toContain(positioning);
    expect(read("PRODUCT.md")).toContain(positioning);
    expect(read("src/lib/app-meta.ts")).toContain(positioning);
    expect(read("src-tauri/Cargo.toml")).toContain(positioning);
    expect(read("src-tauri/src/lib.rs")).toContain(positioning);

    for (const file of trackedTextFiles()) {
      expect(read(file), file).not.toContain(blockedDashboardTerm);
    }
  });
});
