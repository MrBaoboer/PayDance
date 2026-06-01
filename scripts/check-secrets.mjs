// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { execFileSync } from "node:child_process";
import { extname, resolve } from "node:path";
import { readFileSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

const rootArgIndex = process.argv.indexOf("--root");
const root = resolve(rootArgIndex >= 0 ? process.argv[rootArgIndex + 1] : ".");
const self = realpathSync(fileURLToPath(import.meta.url));
const secretPatterns = [
  new RegExp("sk-" + "[A-Za-z0-9_-]{20,}"),
  new RegExp("(api[_-]?key|token|secret)\\s*[:=]\\s*['\"]?[A-Za-z0-9_\\-]{16,}", "i"),
  /BEGIN [A-Z ]*PRIVATE KEY/,
];
const sensitiveFilePatterns = [
  /(^|\/)\.env$/,
  /(^|\/)\.env\./,
  /\.pem$/,
  /\.p12$/,
  /\.pfx$/,
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
  const normalizedFile = file.replaceAll("\\", "/");
  const fullPath = resolve(root, file);

  try {
    if (realpathSync(fullPath) === self) continue;
  } catch {
    continue;
  }

  for (const pattern of sensitiveFilePatterns) {
    if (pattern.test(normalizedFile)) {
      findings.push(`${file}: sensitive file should not be tracked`);
    }
  }

  if (binaryExtensions.has(extname(file).toLowerCase())) continue;

  let content;
  try {
    content = readFileSync(fullPath, "utf8");
  } catch {
    continue;
  }

  const lines = content.split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const pattern of secretPatterns) {
      const match = line.match(pattern);
      if (match) {
        findings.push(`${file}:${index + 1}: possible secret matched [${match[0]}]`);
      }
    }
  });
}

if (findings.length > 0) {
  console.error(`Possible secrets found:\n${findings.join("\n")}`);
  process.exit(1);
}

console.log("Secret hygiene check passed.");
