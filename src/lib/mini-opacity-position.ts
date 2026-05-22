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

export const miniOpacityPanelLogicalSize: MiniOpacitySize = {
  height: 52,
  width: 108,
};

const defaultPanelGap = 6;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const resolveMiniOpacityPanelPhysicalSize = (
  scaleFactor: number,
): MiniOpacitySize => ({
  height: Math.round(miniOpacityPanelLogicalSize.height * scaleFactor),
  width: Math.round(miniOpacityPanelLogicalSize.width * scaleFactor),
});

export const resolveMiniOpacityPanelPosition = ({
  gap = defaultPanelGap,
  miniWindow,
  panelSize,
  workArea,
}: {
  gap?: number;
  miniWindow: MiniOpacityRect;
  panelSize: MiniOpacitySize;
  workArea: MiniOpacityRect;
}) => {
  const minX = workArea.x + gap;
  const maxX = workArea.x + workArea.width - panelSize.width - gap;
  const minY = workArea.y + gap;
  const maxY = workArea.y + workArea.height - panelSize.height - gap;
  const centeredX = miniWindow.x + (miniWindow.width - panelSize.width) / 2;
  const belowY = miniWindow.y + miniWindow.height + gap;
  const aboveY = miniWindow.y - panelSize.height - gap;
  const y = belowY <= maxY ? belowY : aboveY;

  return {
    x: Math.round(clamp(centeredX, minX, maxX)),
    y: Math.round(clamp(y, minY, maxY)),
  };
};

export const resolvePointerMiniOpacityPanelPosition = ({
  gap = defaultPanelGap,
  panelSize,
  pointer,
  workArea,
}: {
  gap?: number;
  panelSize: MiniOpacitySize;
  pointer: { x: number; y: number };
  workArea: MiniOpacityRect;
}) => {
  const minX = workArea.x + gap;
  const maxX = workArea.x + workArea.width - panelSize.width - gap;
  const minY = workArea.y + gap;
  const maxY = workArea.y + workArea.height - panelSize.height - gap;
  const preferredX =
    pointer.x + gap + panelSize.width <= maxX
      ? pointer.x + gap
      : pointer.x - panelSize.width - gap;
  const preferredY =
    pointer.y + gap + panelSize.height <= maxY
      ? pointer.y + gap
      : pointer.y - panelSize.height - gap;

  return {
    x: Math.round(clamp(preferredX, minX, maxX)),
    y: Math.round(clamp(preferredY, minY, maxY)),
  };
};
