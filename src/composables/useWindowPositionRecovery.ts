// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { PhysicalPosition } from "@tauri-apps/api/dpi";
import { availableMonitors, primaryMonitor } from "@tauri-apps/api/window";
import type { Ref } from "vue";
import {
  resolveVisibleWindowPosition,
  type WindowPosition,
  type WindowSize,
  type WindowWorkArea,
} from "../lib/window-mode";

type PositionRecoveryWindow = {
  outerPosition: () => Promise<PhysicalPosition>;
  setPosition: (position: PhysicalPosition) => Promise<void>;
};

export const fallbackMainPosition: WindowPosition = { x: 80, y: 80 };

const readMonitorWorkAreas = async (): Promise<WindowWorkArea[]> => {
  try {
    const monitors = await availableMonitors();
    const primary = await primaryMonitor().catch(() => null);
    const primaryIndex = primary
      ? monitors.findIndex(
          (monitor) =>
            monitor.position.x === primary.position.x &&
            monitor.position.y === primary.position.y &&
            monitor.size.width === primary.size.width &&
            monitor.size.height === primary.size.height,
        )
      : -1;
    const orderedMonitors =
      primaryIndex > 0
        ? [
            monitors[primaryIndex],
            ...monitors.filter((_, index) => index !== primaryIndex),
          ]
        : monitors;

    return orderedMonitors.map((monitor) => ({
      height: monitor.workArea.size.height,
      scaleFactor: monitor.scaleFactor,
      width: monitor.workArea.size.width,
      x: monitor.workArea.position.x,
      y: monitor.workArea.position.y,
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
  miniPosition,
  miniSize,
}: {
  appWindow: PositionRecoveryWindow;
  fullSize: Ref<WindowSize>;
  isMiniMode: Ref<boolean>;
  mainPosition: Ref<WindowPosition | undefined>;
  miniPosition: Ref<WindowPosition | undefined>;
  miniSize: Ref<WindowSize>;
}) {
  const activePosition = () => (isMiniMode.value ? miniPosition : mainPosition);

  const readWindowPosition = (miniMode = isMiniMode.value) => {
    const position = miniMode
      ? (miniPosition.value ?? mainPosition.value)
      : mainPosition.value;

    return position ? { ...position } : undefined;
  };

  const recordWindowPosition = (position: WindowPosition) => {
    activePosition().value = { x: position.x, y: position.y };
  };

  const captureWindowPosition = async () => {
    recordWindowPosition(await appWindow.outerPosition());
  };

  const moveWindowTo = async (position: WindowPosition) => {
    recordWindowPosition(position);
    await appWindow.setPosition(new PhysicalPosition(position.x, position.y));
  };

  const restoreWindowPosition = async (
    savedPosition: WindowPosition | undefined = readWindowPosition(),
  ) => {
    if (!savedPosition) return;

    const visiblePosition = resolveVisibleWindowPosition({
      fallbackPosition: fallbackMainPosition,
      position: savedPosition,
      size: isMiniMode.value ? miniSize.value : fullSize.value,
      workAreas: await readMonitorWorkAreas(),
    });

    if (visiblePosition) {
      await moveWindowTo(visiblePosition);
    }
  };

  return {
    captureWindowPosition,
    readWindowPosition,
    recordWindowPosition,
    restoreWindowPosition,
  };
}
