// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { execFileSync } from "node:child_process";
import { extname, resolve } from "node:path";
import { readFileSync } from "node:fs";

const rootArgIndex = process.argv.indexOf("--root");
const root = resolve(rootArgIndex >= 0 ? process.argv[rootArgIndex + 1] : ".");
const blockedTerms = [
  ["Master", "Bao", "66"].join(""),
  ["master", "bao", "66"].join(""),
  "salary" + "-ticker",
  "Pay" + "Pulse",
  "Labor-Wage" + "-Live-Calc",
  String.fromCodePoint(0x793e, 0x755c),
  String.fromCodePoint(0x8ba1, 0x7b97, 0x5668),
  String.fromCodePoint(0x9ad8, 0x7ea7, 0x725b, 0x9a6c),
];
const binaryExtensions = new Set([
  ".bmp",
  ".dll",
  ".exe",
  ".ico",
  ".jpg",
  ".jpeg",
  ".msi",
  ".png",
  ".webp",
]);
const files = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard"],
  { cwd: root, encoding: "utf8" },
)
  .split(/\r?\n/)
  .filter(Boolean);
const findings = [];

for (const file of files) {
  if (binaryExtensions.has(extname(file).toLowerCase())) continue;

  let content;
  try {
    content = readFileSync(resolve(root, file), "utf8");
  } catch {
    continue;
  }

  const lines = content.split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const term of blockedTerms) {
      if (line.includes(term)) {
        findings.push(`${file}:${index + 1}: blocked legacy wording [${term}]`);
      }
    }
  });
}

if (findings.length > 0) {
  console.error(`Legacy product or account wording found:\n${findings.join("\n")}`);
  process.exit(1);
}

console.log("Brand hygiene check passed.");
