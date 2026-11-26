// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { describe, expect, it } from "vitest";
import {
  buildUsageTrendReport,
  csvHeader,
  hasRowsForDate,
  parseAssetRows,
  parseCsvRows,
  resolveUsageDirectory,
  summarize,
  toCsvLines,
} from "./usage-snapshot.mjs";

describe("usage snapshot", () => {
  const rows = parseAssetRows(
    [
      "v0.9.9\tlatest.json\t1086",
      "v0.9.9\tpay-dance-v0.9.9-windows-x64.exe\t371",
      "v0.9.9\tpay-dance-windows-x64.exe\t2",
      "v0.9.7\tlatest.json\t213",
      "",
    ].join("\n"),
  );

  it("parses the gh tsv rows and writes quoted csv lines", () => {
    expect(rows).toHaveLength(4);
    expect(rows[1]).toEqual({
      tag: "v0.9.9",
      asset: "pay-dance-v0.9.9-windows-x64.exe",
      count: 371,
    });
    expect(csvHeader).toBe("date,tag,asset,download_count");
    expect(toCsvLines("2026-09-21", rows.slice(0, 1))).toEqual([
      '"2026-09-21","v0.9.9","latest.json",1086',
    ]);
  });

  it("totals launches and installs across every release", () => {
    expect(summarize(rows)).toEqual({ exe: 373, latestJson: 1299 });
  });

  it("records each day at most once", () => {
    const csv = `${csvHeader}\n"2026-09-21","v0.9.9","latest.json",1086\n`;

    expect(hasRowsForDate(csv, "2026-09-21")).toBe(true);
    expect(hasRowsForDate(csv, "2026-09-22")).toBe(false);
  });

  it("keeps the csv outside the repository", () => {
    expect(resolveUsageDirectory({ PAYDANCE_USAGE_DIR: "D:/data" }, "win32")).toBe(
      "D:/data",
    );
    expect(
      resolveUsageDirectory({ LOCALAPPDATA: "C:\\Users\\me\\AppData\\Local" }, "win32"),
    ).toBe("C:\\Users\\me\\AppData\\Local\\PayDance\\usage");
    expect(resolveUsageDirectory({}, "linux")).toMatch(
      /[/\\]\.local[/\\]share[/\\]paydance[/\\]usage$/,
    );
  });

  it("summarizes daily deltas from stored csv history", () => {
    const csv = [
      csvHeader,
      '"2026-09-20","v0.9.9","latest.json",1000',
      '"2026-09-20","v0.9.9","pay-dance-v0.9.9-windows-x64.exe",300',
      '"2026-09-21","v0.9.9","latest.json",1086',
      '"2026-09-21","v0.9.9","pay-dance-v0.9.9-windows-x64.exe",315',
    ].join("\n");

    const parsed = parseCsvRows(csv);
    expect(parsed).toHaveLength(4);

    const report = buildUsageTrendReport(csv);
    expect(report).toEqual([
      {
        date: "2026-09-20",
        exe: 300,
        exeDelta: 0,
        launchDelta: 0,
        launchesPerInstall: 3.33,
        latestJson: 1000,
      },
      {
        date: "2026-09-21",
        exe: 315,
        exeDelta: 15,
        launchDelta: 86,
        launchesPerInstall: 3.45,
        latestJson: 1086,
      },
    ]);
  });
});
