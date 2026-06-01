// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const rootArgIndex = process.argv.indexOf("--root");
const root = resolve(rootArgIndex >= 0 ? process.argv[rootArgIndex + 1] : ".");
const readJson = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const packageVersion = readJson("package.json").version;
const tauriVersion = readJson("src-tauri/tauri.conf.json").version;
const cargoToml = readFileSync(resolve(root, "src-tauri/Cargo.toml"), "utf8");
const cargoVersion = cargoToml.match(/^version\s*=\s*"([^"]+)"/m)?.[1];

if (!cargoVersion) {
  console.error("Could not read package version from src-tauri/Cargo.toml");
  process.exit(1);
}

const versions = {
  "package.json": packageVersion,
  "src-tauri/tauri.conf.json": tauriVersion,
  "src-tauri/Cargo.toml": cargoVersion,
};
const uniqueVersions = new Set(Object.values(versions));

if (uniqueVersions.size !== 1) {
  console.error("Version mismatch detected:");
  for (const [file, version] of Object.entries(versions)) {
    console.error(`  ${file}: ${version}`);
  }
  process.exit(1);
}

const tagName = process.env.GITHUB_REF_NAME;
if (tagName?.startsWith("v")) {
  const expectedTag = `v${packageVersion}`;
  if (tagName !== expectedTag) {
    console.error(`Tag ${tagName} does not match project version ${expectedTag}.`);
    process.exit(1);
  }
}

console.log(`Version consistency verified: ${packageVersion}`);
