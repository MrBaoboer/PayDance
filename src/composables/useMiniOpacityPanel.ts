import { LogicalSize, PhysicalPosition } from "@tauri-apps/api/dpi";
import { currentMonitor } from "@tauri-apps/api/window";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import type { Ref } from "vue";
import {
  miniOpacityPanelLogicalSize,
  resolveMiniOpacityPanelAnchorRect,
  resolveMiniOpacityPanelPhysicalGap,
  resolveMiniOpacityPanelPhysicalSize,
  resolveMiniOpacityPanelPosition,
  resolveMiniOpacityPanelWindowPosition,
  resolveScreenWorkArea,
  type MiniOpacityPanelAnchor,
  type MiniOpacityRect,
} from "../lib/mini-opacity-position";
import type { ThemeMode } from "../lib/window-mode";

type MiniOpacityHostWindow = {
  innerPosition: () => Promise<{ x: number; y: number }>;
  innerSize: () => Promise<{ height: number; width: number }>;
};

export const scaleMiniOpacityRect = (
  rect: MiniOpacityRect,
  scaleFactor: number,
) => ({
  height: Math.round(rect.height * scaleFactor),
  width: Math.round(rect.width * scaleFactor),
  x: Math.round(rect.x * scaleFactor),
  y: Math.round(rect.y * scaleFactor),
});

export const resolveFallbackMiniOpacityPanelPlacement = (
  anchor: MiniOpacityPanelAnchor,
  scaleFactor = window.devicePixelRatio || 1,
) => {
  const anchorRect = resolveMiniOpacityPanelAnchorRect(anchor);
  const panelSize = resolveMiniOpacityPanelPhysicalSize(scaleFactor);

  return resolveMiniOpacityPanelPosition({
    anchorRect: scaleMiniOpacityRect(anchorRect, scaleFactor),
    gap: resolveMiniOpacityPanelPhysicalGap(scaleFactor),
    panelSize,
    workArea: scaleMiniOpacityRect(resolveScreenWorkArea(window.screen), scaleFactor),
  });
};

export function useMiniOpacityPanel(
  appWindow: MiniOpacityHostWindow,
  miniOpacityPercent: Ref<number>,
  themeMode: Ref<ThemeMode>,
) {
  const resolveMiniOpacityPanelPlacement = async (
    opacityWindow: WebviewWindow,
  ) => {
    await opacityWindow.setSize(
      new LogicalSize(
        miniOpacityPanelLogicalSize.width,
        miniOpacityPanelLogicalSize.height,
      ),
    );

    const [
      miniPosition,
      miniSize,
      monitor,
      panelInnerSize,
      panelInnerPosition,
      panelOuterPosition,
    ] = await Promise.all([
      appWindow.innerPosition(),
      appWindow.innerSize(),
      currentMonitor(),
      opacityWindow.innerSize(),
      opacityWindow.innerPosition(),
      opacityWindow.outerPosition(),
    ]);
    const scaleFactor = monitor?.scaleFactor ?? window.devicePixelRatio ?? 1;

    return resolveMiniOpacityPanelWindowPosition({
      anchorRect: {
        height: miniSize.height,
        width: miniSize.width,
        x: miniPosition.x,
        y: miniPosition.y,
      },
      gap: resolveMiniOpacityPanelPhysicalGap(scaleFactor),
      panelInnerOffset: {
        x: panelInnerPosition.x - panelOuterPosition.x,
        y: panelInnerPosition.y - panelOuterPosition.y,
      },
      panelSize: {
        height: panelInnerSize.height,
        width: panelInnerSize.width,
      },
      workArea: monitor
        ? {
            height: monitor.workArea.size.height,
            width: monitor.workArea.size.width,
            x: monitor.workArea.position.x,
            y: monitor.workArea.position.y,
          }
        : scaleMiniOpacityRect(resolveScreenWorkArea(window.screen), scaleFactor),
    });
  };

  const showMiniOpacityPanel = async (anchor: MiniOpacityPanelAnchor) => {
    const opacityWindow = await WebviewWindow.getByLabel("mini-opacity");
    if (!opacityWindow) return;

    let position;
    try {
      position = await resolveMiniOpacityPanelPlacement(opacityWindow);
    } catch (error) {
      console.error("Failed to read mini window geometry", error);
      position = resolveFallbackMiniOpacityPanelPlacement(anchor);
    }

    await opacityWindow.setPosition(new PhysicalPosition(position.x, position.y));
    await opacityWindow.emit("mini-opacity-panel-open", {
      value: miniOpacityPercent.value,
      themeMode: themeMode.value,
    });
    await opacityWindow.show();
    await opacityWindow.setFocus();
  };

  return {
    resolveMiniOpacityPanelPlacement,
    showMiniOpacityPanel,
  };
}
