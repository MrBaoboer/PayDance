// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import type { Ref } from "vue";
import {
  normalizeFullSize,
  normalizeMiniOpacityPercent,
  normalizeMiniSize,
  type WindowSize,
} from "../lib/window-mode";

type UnlistenFn = () => void;

type LifecycleWindow = {
  hide: () => Promise<void>;
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
    fullSize,
    isMiniMode,
    isSettingsReady,
    miniSize,
    saveStateNow,
    updateMiniOpacityPercent,
  }: {
    fullSize: Ref<WindowSize>;
    isMiniMode: Ref<boolean>;
    isSettingsReady: Ref<boolean>;
    miniSize: Ref<WindowSize>;
    saveStateNow: () => Promise<void>;
    updateMiniOpacityPercent: (value: number, options?: { commit?: boolean }) => void;
  },
) {
  let saveWindowSizeTimer = 0;

  const registerWindowLifecycle = async () => {
    const unlisteners: UnlistenFn[] = [];

    unlisteners.push(
      await appWindow.onCloseRequested(async (event) => {
        event.preventDefault();
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
      await appWindow.onResized(() => {
        if (!isSettingsReady.value) return;

        window.clearTimeout(saveWindowSizeTimer);
        saveWindowSizeTimer = window.setTimeout(() => {
          const size = {
            width: window.innerWidth,
            height: window.innerHeight,
          };

          if (isMiniMode.value) {
            miniSize.value = normalizeMiniSize(size);
          } else {
            fullSize.value = normalizeFullSize(size);
          }
          void saveStateNow();
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
