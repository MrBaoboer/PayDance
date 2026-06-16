// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";

const target = process.argv[2];
const targets = {
  desktop: {
    blockedAssetPattern: /^WebPreviewApp-[\w-]+\.(css|js)$/,
    blockedName: "WebPreviewApp",
    marker: "tray-open-settings",
  },
  web: {
    blockedAssetPattern: /^DesktopApp-[\w-]+\.(css|js)$/,
    blockedName: "DesktopApp",
    marker: "PayDance Web Preview",
  },
};

if (!Object.hasOwn(targets, target)) {
  throw new Error("Usage: node scripts/assert-build-boundary.mjs <desktop|web>");
}

const distDir = resolve(process.cwd(), "dist");
const assetsDir = resolve(distDir, "assets");

if (!existsSync(assetsDir)) {
  throw new Error(`Build assets directory is missing: ${assetsDir}`);
}

const files = readdirSync(assetsDir).filter((file) =>
  [".css", ".js"].includes(extname(file)),
);
const { blockedAssetPattern, blockedName, marker } = targets[target];
const blockedAssets = files.filter((file) => blockedAssetPattern.test(file));

if (blockedAssets.length > 0) {
  throw new Error(
    `${target} build contains forbidden ${blockedName} assets: ${blockedAssets.join(", ")}`,
  );
}

const textAssets = files.map((file) => ({
  file,
  source: readFileSync(resolve(assetsDir, file), "utf8"),
}));
const packageMetadataSentinels = ["verify:release", "@tauri-apps/plugin-updater"];
const metadataAsset = textAssets.find(({ source }) =>
  packageMetadataSentinels.every((sentinel) => source.includes(sentinel)),
);

if (metadataAsset) {
  throw new Error(
    `${target} build contains package manifest metadata in ${metadataAsset.file}`,
  );
}

const markerAsset = textAssets.find(({ source }) => source.includes(marker));
if (!markerAsset) {
  throw new Error(`Could not find ${target} runtime marker "${marker}" in built assets.`);
}

console.log(
  `[assert-build-boundary] ${target} build excludes ${blockedName} chunks and includes ${markerAsset.file}`,
);
