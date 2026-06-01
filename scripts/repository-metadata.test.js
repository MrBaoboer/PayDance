// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

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
const legacyAdditionalTermsReference = `see /${["ADDITIONAL_TERMS", "md"].join(".")}`;
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

  it("keeps the root LICENSE recognizable as canonical AGPL-3.0", () => {
    const license = read("LICENSE");
    const normalizedLicense = license.replace(/\s+/g, " ");

    expect(license).toContain("GNU AFFERO GENERAL PUBLIC LICENSE");
    expect(license).toContain("Version 3, 19 November 2007");
    expect(license).toContain(
      "The GNU Affero General Public License is a free, copyleft license",
    );
    expect(normalizedLicense).toContain(
      "specifically designed to ensure cooperation with the community in the case of network server software",
    );
    expect(license).not.toContain("Version 3, 29 June 2007");
    expect(license).not.toContain(
      "The GNU General Public License is a free, copyleft license",
    );
    expect(license).not.toContain(
      "The GNU Affero General Public License does not permit incorporating your program into proprietary programs",
    );
    expect(read(".gitattributes")).toContain("LICENSE text eol=lf");
  });

  it("keeps additional terms scoped to AGPL code materials under legal/", () => {
    expect(read("legal/ADDITIONAL_TERMS.md")).toContain(
      "适用于 Mr.Baoboer 拥有版权并以 AGPL-3.0-only 发布的 PayDance 软件代码材料。",
    );
    expect(read("legal/ADDITIONAL_TERMS.md")).not.toContain("代码与相关材料");
    expect(read("legal/ADDITIONAL_TERMS_EN.md")).toContain(
      "They apply to PayDance software code materials copyrighted by Mr.Baoboer and released under AGPL-3.0-only.",
    );
    expect(read("legal/ADDITIONAL_TERMS_EN.md")).not.toContain(
      "code and related materials",
    );

    for (const file of trackedTextFiles()) {
      expect(read(file), file).not.toContain(legacyAdditionalTermsReference);
    }
  });

  it("publishes versioned Windows release assets from the release workflow", () => {
    const releaseWorkflow = read(".github/workflows/release.yml");
    const postReleaseSmoke = read(".github/workflows/post-release-smoke.yml");

    expect(releaseWorkflow).toContain("pay-dance-v$version-windows-x64.exe");
    expect(releaseWorkflow).toContain("portableName");
    expect(releaseWorkflow).toContain("allow_missing_ci_for_repair");
    expect(releaseWorkflow).toContain("ALLOW_MISSING_CI_FOR_REPAIR");
    expect(releaseWorkflow).toContain("Skipping CI gate for existing release repair");
    expect(releaseWorkflow).toContain("npx tauri signer sign");
    expect(releaseWorkflow).toContain("windows-x64.exe.sig");
    expect(releaseWorkflow).toContain("TAURI_SIGNING_PRIVATE_KEY");
    expect(releaseWorkflow).toContain("pay-dance-v");
    expect(releaseWorkflow).toContain("windows-x64");
    expect(releaseWorkflow).not.toContain("pay-dance.exe.sha256");
    expect(releaseWorkflow).toContain("latest.json");
    expect(releaseWorkflow).toContain("fail_on_unmatched_files: true");
    expect(releaseWorkflow).not.toContain(
      '$sigArg = if (Test-Path $sigFile) { "--sig-file $sigFile" } else { "" }',
    );

    expect(postReleaseSmoke).toContain(
      'jq -e \'.platforms["windows-x86_64"].signature | type == "string" and length > 0\' latest.json',
    );
  });

  it("keeps issue template version hints aligned with the current release line", () => {
    const currentVersion = `v${packageJson.version}`;
    expect(read(".github/ISSUE_TEMPLATE.md")).toContain(currentVersion);
    expect(read(".github/ISSUE_TEMPLATE/bug_report.yml")).toContain(currentVersion);
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
