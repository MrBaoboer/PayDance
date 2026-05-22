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
}: {
  clientPoint: MiniOpacityPoint;
  screenPoint: MiniOpacityPoint;
  targetRect: MiniOpacityRect;
}): MiniOpacityRect => ({
  height: targetRect.height,
  width: targetRect.width,
  x: screenPoint.x - clientPoint.x + targetRect.x,
  y: screenPoint.y - clientPoint.y + targetRect.y,
});

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
