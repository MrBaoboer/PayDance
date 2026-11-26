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

  it("freezes document transitions and waits two paint frames before native theme sync", async () => {
    const rafCallbacks: FrameRequestCallback[] = [];
    const classes = new Set<string>();
    const documentStub = {
      documentElement: {
        classList: {
          toggle: (name: string, force?: boolean) => {
            if (force) classes.add(name);
            else classes.delete(name);
          },
        },
        style: { colorScheme: "" },
      },
    };
    vi.stubGlobal("document", documentStub);
    vi.stubGlobal("window", {
      requestAnimationFrame: (callback: FrameRequestCallback) => {
        rafCallbacks.push(callback);
        return rafCallbacks.length;
      },
    });

    const themeMode = ref<ThemeMode>("light");
    const setTheme = vi.fn(async () => {});
    const saveStateNow = vi.fn(async () => {});
    const { applyThemeMode, isThemeSwitching } = useThemeSync(
      { setTheme },
      themeMode,
      saveStateNow,
    );

    const flushFrames = async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    };

    const pending = applyThemeMode("dark");
    expect(classes.has("is-theme-switching")).toBe(true);
    expect(documentStub.documentElement.style.colorScheme).toBe("dark");
    expect(setTheme).not.toHaveBeenCalled();

    // First frame runs before paint; native setTheme must wait for the second frame.
    rafCallbacks.shift()?.(0);
    await flushFrames();
    expect(setTheme).not.toHaveBeenCalled();

    rafCallbacks.shift()?.(16);
    await flushFrames();
    expect(setTheme).toHaveBeenCalledWith("dark");

    rafCallbacks.shift()?.(32);
    await pending;

    expect(classes.has("is-theme-switching")).toBe(false);
    expect(isThemeSwitching.value).toBe(false);
  });
});
