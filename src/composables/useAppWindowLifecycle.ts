// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import type { Ref } from "vue";
import { miniPanelRestoreEventName, windowShownEventName } from "../lib/app-events";
import {
  fromDesktopHostSize,
  normalizeFullSize,
  normalizeMiniOpacityPercent,
  normalizeMiniSize,
  type WindowSize,
} from "../lib/window-mode";

type UnlistenFn = () => void;

type LifecycleWindow = {
  hide: () => Promise<void>;
  isMinimized?: () => Promise<boolean>;
  listen: <T>(
    event: string,
    handler: (event: { payload: T }) => void,
  ) => Promise<UnlistenFn>;
  onCloseRequested: (
    handler: (event: { preventDefault: () => void }) => Promise<void> | void,
  ) => Promise<UnlistenFn>;
  onResized: (handler: () => void) => Promise<UnlistenFn>;
};

export function useAppWindowLifecycle(
  appWindow: LifecycleWindow,
  {
    ensureWindowOnScreen = async () => false,
    fullSize,
    hideMiniOpacityPanel = async () => undefined,
    isMiniMode,
    isSettingsReady,
    miniSize,
    onRestoreFromMini = async () => undefined,
    onWindowShown = () => undefined,
    reapplyTaskbarVisibility = async () => undefined,
    saveStateNow,
    updateMiniOpacityPercent,
  }: {
    ensureWindowOnScreen?: () => Promise<boolean>;
    hideMiniOpacityPanel?: () => Promise<void>;
    onRestoreFromMini?: () => Promise<void> | void;
    onWindowShown?: () => void;
    reapplyTaskbarVisibility?: () => Promise<void>;
    fullSize: Ref<WindowSize>;
    isMiniMode: Ref<boolean>;
    isSettingsReady: Ref<boolean>;
    miniSize: Ref<WindowSize>;
    saveStateNow: () => Promise<void>;
    updateMiniOpacityPercent: (value: number, options?: { commit?: boolean }) => void;
  },
) {
  let saveWindowSizeTimer = 0;

  const isWindowMinimized = async () => {
    try {
      return (await appWindow.isMinimized?.()) === true;
    } catch {
      return false;
    }
  };

  // Windows resizes a minimized window's client area to nothing before parking it offscreen.
  // Persisting that would silently shrink the saved window size to its minimum, so skip it.
  const persistWindowSize = async () => {
    if (await isWindowMinimized()) return;

    const hostSize = { width: window.innerWidth, height: window.innerHeight };
    if (hostSize.width <= 0 || hostSize.height <= 0) return;

    const contentSize = fromDesktopHostSize(hostSize, isMiniMode.value);
    if (isMiniMode.value) {
      miniSize.value = normalizeMiniSize(contentSize);
    } else {
      fullSize.value = normalizeFullSize(contentSize);
    }

    await saveStateNow();
  };

  const registerWindowLifecycle = async () => {
    const unlisteners: UnlistenFn[] = [];

    unlisteners.push(
      await appWindow.onCloseRequested(async (event) => {
        event.preventDefault();
        await hideMiniOpacityPanel();
        await appWindow.hide();
      }),
    );

    unlisteners.push(
      await appWindow.listen<{ value?: number; commit?: boolean }>(
        "mini-opacity-change",
        (event) => {
          updateMiniOpacityPercent(normalizeMiniOpacityPercent(event.payload.value), {
            commit: event.payload.commit === true,
          });
        },
      ),
    );

    unlisteners.push(
      await appWindow.listen(miniPanelRestoreEventName, () => {
        void onRestoreFromMini();
      }),
    );

    // The Rust side shows the window from the tray, a tray click, or a second launch. Any of
    // those can surface a window that a full-screen app left minimized and parked offscreen,
    // so re-check reachability every time instead of only at startup.
    unlisteners.push(
      await appWindow.listen(windowShownEventName, () => {
        onWindowShown();
        // Showing the window again re-adds the taskbar button Windows dropped for mini mode.
        void reapplyTaskbarVisibility();
        void ensureWindowOnScreen().then((moved) => {
          if (moved) return saveStateNow();
        });
      }),
    );

    unlisteners.push(
      await appWindow.onResized(() => {
        if (!isSettingsReady.value) return;

        window.clearTimeout(saveWindowSizeTimer);
        saveWindowSizeTimer = window.setTimeout(() => {
          void persistWindowSize();
        }, 180);
      }),
    );

    return unlisteners;
  };

  const clearWindowLifecycleTimers = () => {
    window.clearTimeout(saveWindowSizeTimer);
  };

  return {
    clearWindowLifecycleTimers,
    registerWindowLifecycle,
  };
}
