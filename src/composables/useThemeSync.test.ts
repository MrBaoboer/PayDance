// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { useThemeSync } from "./useThemeSync";
import type { ThemeMode } from "../lib/window-mode";

describe("useThemeSync", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      requestAnimationFrame: (callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("updates the web theme before syncing the native window theme", async () => {
    const themeMode = ref<ThemeMode>("light");
    const nativeThemes: ThemeMode[] = [];
    const setTheme = vi.fn(async (mode: ThemeMode) => {
      nativeThemes.push(mode);
      expect(themeMode.value).toBe(mode);
    });
    const saveStateNow = vi.fn(async () => {});

    const { applyThemeMode, isThemeSwitching } = useThemeSync(
      { setTheme },
      themeMode,
      saveStateNow,
    );

    await applyThemeMode("dark");

    expect(isThemeSwitching.value).toBe(false);
    expect(themeMode.value).toBe("dark");
    expect(nativeThemes).toEqual(["dark"]);
    expect(saveStateNow).toHaveBeenCalledTimes(1);
  });

  it("can sync without persisting during startup", async () => {
    const themeMode = ref<ThemeMode>("dark");
    const setTheme = vi.fn(async () => {});
    const saveStateNow = vi.fn(async () => {});

    const { applyThemeMode } = useThemeSync({ setTheme }, themeMode, saveStateNow);

    await applyThemeMode("light", { persist: false });

    expect(themeMode.value).toBe("light");
    expect(setTheme).toHaveBeenCalledWith("light");
    expect(saveStateNow).not.toHaveBeenCalled();
  });
});
