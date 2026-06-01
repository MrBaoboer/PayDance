// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

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

const sigFile = getArg("--sig-file");
if (!sigFile) {
  console.error("Missing required --sig-file argument");
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

let signature = "";
try {
  signature = readFileSync(sigFile, "utf8").trim();
} catch {
  console.error(`Could not read signature file: ${sigFile}`);
  process.exit(1);
}

if (!signature) {
  console.error(`Signature file is empty: ${sigFile}`);
  process.exit(1);
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
