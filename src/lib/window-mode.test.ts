import { describe, expect, it } from "vitest";
import {
  currentSettingsSchemaVersion,
  defaultMiniOpacityPercent,
  fullWindowMinSize,
  maxMiniOpacityPercent,
  miniDefaultSize,
  miniMinSize,
  minMiniOpacityPercent,
  normalizeFullSize,
  normalizeMiniOpacityPercent,
  normalizeMiniSize,
  resolveWindowPreferences,
} from "./window-mode";

describe("window mode preferences", () => {
  it("uses a compact mini window default for v0.4", () => {
    expect(miniDefaultSize).toEqual({ width: 176, height: 54 });
    expect(miniMinSize).toEqual({ width: 148, height: 44 });
  });

  it("clamps mini window size to the supported minimum", () => {
    expect(normalizeMiniSize({ width: 80, height: 20 })).toEqual({
      width: 148,
      height: 44,
    });
  });

  it("clamps full window size to the supported minimum", () => {
    expect(normalizeFullSize({ width: 80, height: 20 })).toEqual(fullWindowMinSize);
  });

  it("uses a calm translucent mini opacity by default", () => {
    expect(minMiniOpacityPercent).toBe(10);
    expect(maxMiniOpacityPercent).toBe(100);
    expect(defaultMiniOpacityPercent).toBe(85);
  });

  it("clamps mini window opacity to the supported range", () => {
    expect(normalizeMiniOpacityPercent(undefined)).toBe(defaultMiniOpacityPercent);
    expect(normalizeMiniOpacityPercent(4)).toBe(10);
    expect(normalizeMiniOpacityPercent(108)).toBe(100);
    expect(normalizeMiniOpacityPercent(73.4)).toBe(73);
  });

  it("migrates old saved mini sizes to the new compact default", () => {
    expect(
      resolveWindowPreferences({
        savedIsMiniMode: true,
        savedMiniSize: { width: 256, height: 84 },
        savedSettingsVersion: currentSettingsSchemaVersion - 1,
      }),
    ).toEqual({
      isMiniMode: true,
      miniSize: miniDefaultSize,
      fullSize: { width: 480, height: 460 },
      miniOpacityPercent: defaultMiniOpacityPercent,
    });
  });

  it("preserves saved mini sizes from the current schema", () => {
    expect(
      resolveWindowPreferences({
        savedIsMiniMode: true,
        savedMiniSize: { width: 220, height: 64 },
        savedMiniOpacityPercent: 64,
        savedSettingsVersion: currentSettingsSchemaVersion,
      }),
    ).toEqual({
      isMiniMode: true,
      miniSize: { width: 220, height: 64 },
      fullSize: { width: 480, height: 460 },
      miniOpacityPercent: 64,
    });
  });

  it("preserves saved mini sizes from newer app settings schema versions", () => {
    expect(
      resolveWindowPreferences({
        savedIsMiniMode: true,
        savedMiniSize: { width: 210, height: 58 },
        savedMiniOpacityPercent: 7,
        savedSettingsVersion: currentSettingsSchemaVersion + 1,
      }),
    ).toEqual({
      isMiniMode: true,
      miniSize: { width: 210, height: 58 },
      fullSize: { width: 480, height: 460 },
      miniOpacityPercent: 10,
    });
  });

  it("preserves saved full window size from the current schema", () => {
    expect(
      resolveWindowPreferences({
        savedIsMiniMode: false,
        savedMiniSize: { width: 210, height: 58 },
        savedFullSize: { width: 720, height: 540 },
        savedSettingsVersion: currentSettingsSchemaVersion,
      }),
    ).toEqual({
      isMiniMode: false,
      miniSize: { width: 210, height: 58 },
      fullSize: { width: 720, height: 540 },
      miniOpacityPercent: defaultMiniOpacityPercent,
    });
  });
});
