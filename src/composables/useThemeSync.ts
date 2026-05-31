// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /ADDITIONAL_TERMS.md

import { ref, type Ref } from "vue";
import type { ThemeMode } from "../lib/window-mode";

type ThemeWindow = {
  setTheme: (theme: ThemeMode) => Promise<void>;
};

const waitForThemePaint = () =>
  new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });

export function useThemeSync(
  appWindow: ThemeWindow,
  themeMode: Ref<ThemeMode>,
  saveStateNow: () => Promise<void>,
) {
  const isThemeSwitching = ref(false);
  let themeApplyToken = 0;

  const applyThemeMode = async (mode: ThemeMode, options: { persist?: boolean } = {}) => {
    const { persist = true } = options;
    const token = ++themeApplyToken;
    isThemeSwitching.value = true;

    try {
      themeMode.value = mode;
      await waitForThemePaint();
      if (token !== themeApplyToken) return;

      await appWindow.setTheme(mode);
      if (token !== themeApplyToken) return;

      if (persist) {
        await saveStateNow();
      }
    } finally {
      if (token === themeApplyToken) {
        isThemeSwitching.value = false;
      }
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    if (isThemeSwitching.value) return;
    if (themeMode.value === mode) return;

    await applyThemeMode(mode);
  };

  const toggleTheme = async () => {
    if (isThemeSwitching.value) return;

    const nextMode = themeMode.value === "dark" ? "light" : "dark";
    await applyThemeMode(nextMode);
  };

  return {
    applyThemeMode,
    isThemeSwitching,
    setThemeMode,
    toggleTheme,
  };
}
