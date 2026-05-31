// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /ADDITIONAL_TERMS.md

// ---------------------------------------------------------------------------
// Build latest.json for the Tauri updater static endpoint.
//
// Usage: node scripts/release/build-latest-json.mjs --version 0.9.1 [--notes "..."|--notes-file release-notes.md]
//
// Output written to stdout. Redirect to release-assets/latest.json.
// ---------------------------------------------------------------------------

import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const getArg = (flag) => {
  const idx = args.indexOf(flag);
  return idx >= 0 ? args[idx + 1] : undefined;
};

const version = getArg("--version");
if (!version) {
  console.error("Missing required --version argument");
  process.exit(1);
}

let notes = getArg("--notes") ?? "";
const notesFile = getArg("--notes-file");
if (notesFile) {
  try {
    notes = readFileSync(notesFile, "utf8").trim();
  } catch {
    console.error(`Could not read notes file: ${notesFile}`);
    notes = "";
  }
}

const sigFile = getArg("--sig-file");
let signature = "";
if (sigFile) {
  try {
    signature = readFileSync(sigFile, "utf8").trim();
  } catch {
    console.error(`Could not read signature file: ${sigFile}`);
  }
}

const portableUrl =
  getArg("--url") ??
  `https://github.com/MasterBao66/PayDance/releases/latest/download/pay-dance-v${version}-windows-x64.exe`;

const latestJson = {
  version: `v${version}`,
  notes,
  pub_date: new Date().toISOString(),
  platforms: {
    "windows-x86_64": {
      signature,
      url: portableUrl,
    },
  },
};

process.stdout.write(JSON.stringify(latestJson, null, 2) + "\n");
