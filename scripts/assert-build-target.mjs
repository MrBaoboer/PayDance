// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { existsSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";

const target = process.argv[2];
const targets = {
  desktop: {
    expected: "desktop",
    marker: "tray-open-settings",
    unexpected: "WebPreviewApp",
  },
  web: {
    expected: "web",
    marker: "PayDance Web Preview",
    unexpected: "DesktopApp",
  },
};

if (!Object.hasOwn(targets, target)) {
  throw new Error("Usage: node scripts/assert-build-target.mjs <desktop|web>");
}

const distDir = resolve(process.cwd(), "dist");
const htmlPath = resolve(distDir, "index.html");
const html = readFileSync(htmlPath, "utf8");
const scriptMatches = [
  ...html.matchAll(/<script\b[^>]*\bsrc="([^"]*\/assets\/[^"]+\.js)"/g),
];

if (scriptMatches.length === 0) {
  throw new Error("Could not find the built module entry in dist/index.html");
}

const entrySources = scriptMatches.map((match) => {
  const entryFile = basename(match[1]);
  const entryPath = resolve(distDir, "assets", entryFile);
  if (!existsSync(entryPath)) {
    throw new Error(`Built entry script is missing: ${entryPath}`);
  }
  return readFileSync(entryPath, "utf8");
});
const entrySource = entrySources.join("\n");
const { expected, marker, unexpected } = targets[target];
const unexpectedPattern = new RegExp(`${unexpected}-[\\w-]+\\.js`);

if (!entrySource.includes(marker)) {
  throw new Error(
    `Expected ${target} build entry to include the ${expected} runtime marker`,
  );
}

if (unexpectedPattern.test(entrySource)) {
  throw new Error(
    `Unexpected ${unexpected}.vue target leaked into ${target} build entry`,
  );
}

console.log(`[assert-build-target] ${target} build entry includes ${expected} runtime`);
