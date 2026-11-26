// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { ref, type Ref } from "vue";
import type { ThemeMode } from "../lib/window-mode";

type ThemeWindow = {
  setTheme: (theme: ThemeMode) => Promise<void>;
};

const themeSwitchingClass = "is-theme-switching";

const waitForNextFrame = () =>
  new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });

// A single rAF runs *before* the browser paints the upcoming frame; waiting two frames
// guarantees the new palette has actually committed to the compositor before native
// DWM / WebView2 theme sync runs.
const waitForThemePaint = async () => {
  await waitForNextFrame();
  await waitForNextFrame();
};

const setDocumentThemeSwitching = (switching: boolean) => {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle(themeSwitchingClass, switching);
};

const syncDocumentColorScheme = (mode: ThemeMode) => {
  if (typeof document === "undefined") return;
  document.documentElement.style.colorScheme = mode;
};

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
    setDocumentThemeSwitching(true);

    try {
      syncDocumentColorScheme(mode);
      themeMode.value = mode;
      await waitForThemePaint();
      if (token !== themeApplyToken) return;

      await appWindow.setTheme(mode);
      if (token !== themeApplyToken) return;

      await waitForNextFrame();
      if (token !== themeApplyToken) return;

      // Release the atomic paint freeze as soon as web + native surfaces settle; do not
      // hold interactive theme toggles behind disk persistence.
      setDocumentThemeSwitching(false);
      isThemeSwitching.value = false;

      if (persist) {
        await saveStateNow();
      }
    } finally {
      if (token === themeApplyToken) {
        setDocumentThemeSwitching(false);
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
