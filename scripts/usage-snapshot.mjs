// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

// Appends today's cumulative download count of every Release asset to a CSV that stays on
// this machine. The app and the site carry no telemetry, so these public counters are the only
// usage signal: latest.json downloads ≈ desktop launches (the updater fetches it once per
// launch), EXE downloads ≈ installs.
//
// Usage: npm run usage:snapshot   (needs an authenticated GitHub CLI)
// Output: %LOCALAPPDATA%\PayDance\usage\downloads.csv, or $PAYDANCE_USAGE_DIR/downloads.csv

import { execFileSync } from "node:child_process";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { join, win32 } from "node:path";
import { pathToFileURL } from "node:url";

const repository = process.env.GITHUB_REPOSITORY || "MrBaoboer/PayDance";

export const csvHeader = "date,tag,asset,download_count";

export function resolveUsageDirectory(env = process.env, platform = process.platform) {
  if (env.PAYDANCE_USAGE_DIR) return env.PAYDANCE_USAGE_DIR;
  if (platform === "win32" && env.LOCALAPPDATA) {
    // win32.join keeps the separators deterministic when the tests run on Linux CI.
    return win32.join(env.LOCALAPPDATA, "PayDance", "usage");
  }
  return join(homedir(), ".local", "share", "paydance", "usage");
}

// Rows come from `gh api .../releases` shaped as tag<TAB>asset<TAB>count.
export function parseAssetRows(tsv) {
  return tsv
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const [tag, asset, count] = line.split("\t");
      return { tag, asset, count: Number(count) };
    });
}

export function toCsvLines(date, rows) {
  const quote = (value) => `"${String(value).replaceAll('"', '""')}"`;
  return rows.map(
    (row) => `${quote(date)},${quote(row.tag)},${quote(row.asset)},${row.count}`,
  );
}

export function summarize(rows) {
  const total = (predicate) =>
    rows.filter(predicate).reduce((sum, row) => sum + row.count, 0);

  return {
    exe: total((row) => row.asset.endsWith("windows-x64.exe")),
    latestJson: total((row) => row.asset === "latest.json"),
  };
}

export function hasRowsForDate(csv, date) {
  return csv.split(/\r?\n/).some((line) => line.startsWith(`"${date}",`));
}

function main() {
  const date = new Date().toISOString().slice(0, 10);
  const directory = resolveUsageDirectory();
  const file = join(directory, "downloads.csv");
  mkdirSync(directory, { recursive: true });

  const existing = existsSync(file) ? readFileSync(file, "utf8") : "";
  if (!existing) writeFileSync(file, `${csvHeader}\n`);
  if (hasRowsForDate(existing, date)) {
    console.log(`[usage-snapshot] ${date} is already recorded in ${file}`);
    return;
  }

  const tsv = execFileSync(
    "gh",
    [
      "api",
      `repos/${repository}/releases`,
      "--paginate",
      "--jq",
      ".[] | .tag_name as $tag | .assets[] | [$tag, .name, .download_count] | @tsv",
    ],
    { encoding: "utf8" },
  );
  const rows = parseAssetRows(tsv);
  appendFileSync(file, `${toCsvLines(date, rows).join("\n")}\n`);

  const { exe, latestJson } = summarize(rows);
  console.log(`[usage-snapshot] ${date}: ${rows.length} asset rows appended to ${file}`);
  console.log(
    `[usage-snapshot] cumulative EXE downloads ${exe}, latest.json fetches ${latestJson}`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
