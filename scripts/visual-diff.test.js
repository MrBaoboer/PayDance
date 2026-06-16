// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { PNG } from "pngjs";
import { afterEach, describe, expect, it } from "vitest";

const testRoot = join(tmpdir(), `paydance-visual-diff-${process.pid}`);

const writePng = (path, width, height, color) => {
  const image = new PNG({ width, height });
  for (let offset = 0; offset < image.data.length; offset += 4) {
    image.data[offset] = color[0];
    image.data[offset + 1] = color[1];
    image.data[offset + 2] = color[2];
    image.data[offset + 3] = color[3];
  }
  writeFileSync(path, PNG.sync.write(image));
};

const loadCompare = async () => {
  const module = await import("./visual-diff.mjs");
  return module.comparePngFiles;
};

afterEach(() => {
  rmSync(testRoot, { force: true, recursive: true });
});

describe("visual PNG comparison", () => {
  it("keeps small runner noise within budget but rejects visible regressions", async () => {
    const { isVisualRegression } = await import("./visual-diff.mjs");

    expect(isVisualRegression(0.00412)).toBe(false);
    expect(isVisualRegression(0.006)).toBe(true);
  });

  it("reports no changed pixels for identical images", async () => {
    mkdirSync(testRoot, { recursive: true });
    const baselinePath = join(testRoot, "baseline.png");
    const actualPath = join(testRoot, "actual.png");
    const diffPath = join(testRoot, "diff.png");
    writePng(baselinePath, 2, 2, [255, 255, 255, 255]);
    writePng(actualPath, 2, 2, [255, 255, 255, 255]);

    const comparePngFiles = await loadCompare();
    const result = comparePngFiles({ actualPath, baselinePath, diffPath });

    expect(result).toMatchObject({ diffPixels: 0, ratio: 0 });
  });

  it("writes a diff and reports changed pixels", async () => {
    mkdirSync(testRoot, { recursive: true });
    const baselinePath = join(testRoot, "baseline.png");
    const actualPath = join(testRoot, "actual.png");
    const diffPath = join(testRoot, "diff.png");
    writePng(baselinePath, 2, 2, [255, 255, 255, 255]);
    writePng(actualPath, 2, 2, [0, 0, 0, 255]);

    const comparePngFiles = await loadCompare();
    const result = comparePngFiles({ actualPath, baselinePath, diffPath });

    expect(result.diffPixels).toBe(4);
    expect(result.ratio).toBe(1);
    expect(result.diffPath).toBe(diffPath);
  });

  it("rejects images with different dimensions", async () => {
    mkdirSync(testRoot, { recursive: true });
    const baselinePath = join(testRoot, "baseline.png");
    const actualPath = join(testRoot, "actual.png");
    writePng(baselinePath, 2, 2, [255, 255, 255, 255]);
    writePng(actualPath, 3, 2, [255, 255, 255, 255]);

    const comparePngFiles = await loadCompare();

    expect(() =>
      comparePngFiles({
        actualPath,
        baselinePath,
        diffPath: join(testRoot, "diff.png"),
      }),
    ).toThrow(/dimensions/);
  });

  it("explains how to create a missing baseline", async () => {
    mkdirSync(testRoot, { recursive: true });
    const actualPath = join(testRoot, "actual.png");
    writePng(actualPath, 2, 2, [255, 255, 255, 255]);

    const comparePngFiles = await loadCompare();

    expect(() =>
      comparePngFiles({
        actualPath,
        baselinePath: join(testRoot, "missing.png"),
        diffPath: join(testRoot, "diff.png"),
      }),
    ).toThrow(/qa:web-preview:update/);
  });
});
