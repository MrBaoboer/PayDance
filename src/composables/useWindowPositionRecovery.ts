// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { LogicalPosition } from "@tauri-apps/api/dpi";
import { availableMonitors } from "@tauri-apps/api/window";
import type { Ref } from "vue";
import {
  resolveVisibleWindowPosition,
  type WindowPosition,
  type WindowSize,
  type WindowWorkArea,
} from "../lib/window-mode";

type PositionRecoveryWindow = {
  setPosition: (position: LogicalPosition) => Promise<void>;
};

export const fallbackMainPosition: WindowPosition = { x: 80, y: 80 };

const readMonitorWorkAreas = async (): Promise<WindowWorkArea[]> => {
  try {
    const monitors = await availableMonitors();
    return monitors.map((monitor) => ({
      height: monitor.size.height,
      width: monitor.size.width,
      x: monitor.position.x,
      y: monitor.position.y,
    }));
  } catch {
    return [];
  }
};

export function useWindowPositionRecovery({
  appWindow,
  fullSize,
  isMiniMode,
  mainPosition,
  miniSize,
  saveStateNow,
}: {
  appWindow: PositionRecoveryWindow;
  fullSize: Ref<WindowSize>;
  isMiniMode: Ref<boolean>;
  mainPosition: Ref<WindowPosition | undefined>;
  miniSize: Ref<WindowSize>;
  saveStateNow: () => Promise<void>;
}) {
  const moveWindowTo = async (position: WindowPosition) => {
    mainPosition.value = position;
    await appWindow.setPosition(new LogicalPosition(position.x, position.y));
  };

  const restoreWindowPosition = async () => {
    if (!mainPosition.value) return;

    const visiblePosition = resolveVisibleWindowPosition({
      fallbackPosition: fallbackMainPosition,
      position: mainPosition.value,
      size: isMiniMode.value ? miniSize.value : fullSize.value,
      workAreas: await readMonitorWorkAreas(),
    });

    if (visiblePosition) {
      await moveWindowTo(visiblePosition);
    }
  };

  const resetWindowPosition = async () => {
    await moveWindowTo(fallbackMainPosition);
    await saveStateNow();
  };

  return {
    resetWindowPosition,
    restoreWindowPosition,
  };
}
