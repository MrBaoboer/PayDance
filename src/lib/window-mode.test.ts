import { describe, expect, it } from "vitest";
import {
  currentSettingsSchemaVersion,
  miniDefaultSize,
  miniMinSize,
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
    });
  });

  it("preserves saved mini sizes from the current schema", () => {
    expect(
      resolveWindowPreferences({
        savedIsMiniMode: true,
        savedMiniSize: { width: 220, height: 64 },
        savedSettingsVersion: currentSettingsSchemaVersion,
      }),
    ).toEqual({
      isMiniMode: true,
      miniSize: { width: 220, height: 64 },
    });
  });

  it("preserves saved mini sizes from newer app settings schema versions", () => {
    expect(
      resolveWindowPreferences({
        savedIsMiniMode: true,
        savedMiniSize: { width: 210, height: 58 },
        savedSettingsVersion: currentSettingsSchemaVersion + 1,
      }),
    ).toEqual({
      isMiniMode: true,
      miniSize: { width: 210, height: 58 },
    });
  });
});
