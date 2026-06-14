// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

export const comparePngFiles = ({
  actualPath,
  baselinePath,
  diffPath,
  threshold = 0.1,
}) => {
  if (!existsSync(baselinePath)) {
    throw new Error(
      `Missing visual baseline: ${baselinePath}. Run npm run qa:web-preview:update to create it.`,
    );
  }

  const baseline = PNG.sync.read(readFileSync(baselinePath));
  const actual = PNG.sync.read(readFileSync(actualPath));

  if (baseline.width !== actual.width || baseline.height !== actual.height) {
    throw new Error(
      `Visual baseline dimensions ${baseline.width}x${baseline.height} do not match actual dimensions ${actual.width}x${actual.height}.`,
    );
  }

  const diff = new PNG({ width: baseline.width, height: baseline.height });
  const diffPixels = pixelmatch(
    baseline.data,
    actual.data,
    diff.data,
    baseline.width,
    baseline.height,
    {
      includeAA: false,
      threshold,
    },
  );

  mkdirSync(dirname(diffPath), { recursive: true });
  writeFileSync(diffPath, PNG.sync.write(diff));

  return {
    diffPath,
    diffPixels,
    ratio: diffPixels / (baseline.width * baseline.height),
  };
};
