// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /ADDITIONAL_TERMS.md

export type MiniOpacityRect = {
  height: number;
  width: number;
  x: number;
  y: number;
};

export type MiniOpacitySize = {
  height: number;
  width: number;
};

export type MiniOpacityPoint = {
  x: number;
  y: number;
};

export type MiniOpacityPanelAnchor = {
  clientPoint: MiniOpacityPoint;
  screenPoint: MiniOpacityPoint;
  targetRect: MiniOpacityRect;
};

export const miniOpacityPanelLogicalSize: MiniOpacitySize = {
  height: 52,
  width: 108,
};

const defaultPanelGap = 8;

const clamp = (value: number, min: number, max: number) =>
  max < min ? min : Math.min(Math.max(value, min), max);

export const resolveMiniOpacityPanelAnchorRect = ({
  clientPoint,
  screenPoint,
  targetRect,
}: MiniOpacityPanelAnchor): MiniOpacityRect => ({
  height: targetRect.height,
  width: targetRect.width,
  x: screenPoint.x - clientPoint.x + targetRect.x,
  y: screenPoint.y - clientPoint.y + targetRect.y,
});

export const resolveMiniOpacityPanelPhysicalSize = (
  scaleFactor: number,
): MiniOpacitySize => ({
  height: Math.round(miniOpacityPanelLogicalSize.height * scaleFactor),
  width: Math.round(miniOpacityPanelLogicalSize.width * scaleFactor),
});

export const resolveMiniOpacityPanelPhysicalGap = (scaleFactor: number) =>
  Math.round(defaultPanelGap * scaleFactor);

export const resolveMiniOpacityPanelPosition = ({
  anchorRect,
  gap = defaultPanelGap,
  panelSize = miniOpacityPanelLogicalSize,
  workArea,
}: {
  anchorRect: MiniOpacityRect;
  gap?: number;
  panelSize?: MiniOpacitySize;
  workArea: MiniOpacityRect;
}) => {
  const minX = workArea.x + gap;
  const maxX = workArea.x + workArea.width - panelSize.width - gap;
  const minY = workArea.y + gap;
  const maxY = workArea.y + workArea.height - panelSize.height - gap;
  const centeredX = anchorRect.x + (anchorRect.width - panelSize.width) / 2;
  const belowY = anchorRect.y + anchorRect.height + gap;
  const aboveY = anchorRect.y - panelSize.height - gap;
  const y = belowY <= maxY ? belowY : aboveY;

  return {
    x: Math.round(clamp(centeredX, minX, maxX)),
    y: Math.round(clamp(y, minY, maxY)),
  };
};

export const resolveMiniOpacityPanelWindowPosition = ({
  anchorRect,
  gap = defaultPanelGap,
  panelInnerOffset = { x: 0, y: 0 },
  panelSize = miniOpacityPanelLogicalSize,
  workArea,
}: {
  anchorRect: MiniOpacityRect;
  gap?: number;
  panelInnerOffset?: MiniOpacityPoint;
  panelSize?: MiniOpacitySize;
  workArea: MiniOpacityRect;
}) => {
  const contentPosition = resolveMiniOpacityPanelPosition({
    anchorRect,
    gap,
    panelSize,
    workArea,
  });

  return {
    x: contentPosition.x - panelInnerOffset.x,
    y: contentPosition.y - panelInnerOffset.y,
  };
};

export const resolveScreenWorkArea = (
  screen: Pick<Screen, "availHeight" | "availWidth"> & {
    availLeft?: number;
    availTop?: number;
  },
): MiniOpacityRect => ({
  height: screen.availHeight,
  width: screen.availWidth,
  x: screen.availLeft ?? 0,
  y: screen.availTop ?? 0,
});
