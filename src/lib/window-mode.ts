// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

export type ThemeMode = "light" | "dark";

export type WindowSize = {
  width: number;
  height: number;
};

export type WindowPosition = {
  x: number;
  y: number;
};

export type WindowWorkArea = WindowPosition &
  WindowSize & {
    scaleFactor?: number;
  };

export const windowSettingsSchemaVersion = 2;
export const currentSettingsSchemaVersion = windowSettingsSchemaVersion;

export const fullWindowSize: WindowSize = { width: 480, height: 460 };
export const fullWindowMinSize: WindowSize = { width: 430, height: 410 };
export const miniDefaultSize: WindowSize = { width: 176, height: 54 };
export const miniMinSize: WindowSize = { width: 148, height: 44 };
export const miniResizeEdgeSize = 10;
export const minMiniOpacityPercent = 10;
export const maxMiniOpacityPercent = 100;
export const defaultMiniOpacityPercent = 85;

export const normalizeMiniSize = (
  size: Partial<WindowSize> | null | undefined,
): WindowSize => ({
  width: Math.max(miniMinSize.width, Math.round(size?.width ?? miniDefaultSize.width)),
  height: Math.max(
    miniMinSize.height,
    Math.round(size?.height ?? miniDefaultSize.height),
  ),
});

export const normalizeFullSize = (
  size: Partial<WindowSize> | null | undefined,
): WindowSize => ({
  width: Math.max(
    fullWindowMinSize.width,
    Math.round(size?.width ?? fullWindowSize.width),
  ),
  height: Math.max(
    fullWindowMinSize.height,
    Math.round(size?.height ?? fullWindowSize.height),
  ),
});

const defaultRestoreMargin = 16;

const clampValue = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const resolveScaleFactor = (workArea: WindowWorkArea) =>
  typeof workArea.scaleFactor === "number" &&
  Number.isFinite(workArea.scaleFactor) &&
  workArea.scaleFactor > 0
    ? workArea.scaleFactor
    : 1;

const containsPoint = (workArea: WindowWorkArea, position: WindowPosition) =>
  position.x >= workArea.x &&
  position.x < workArea.x + workArea.width &&
  position.y >= workArea.y &&
  position.y < workArea.y + workArea.height;

const resolveOverlapArea = (
  workArea: WindowWorkArea,
  position: WindowPosition,
  size: WindowSize,
) => {
  const scaleFactor = resolveScaleFactor(workArea);
  const physicalWidth = Math.round(size.width * scaleFactor);
  const physicalHeight = Math.round(size.height * scaleFactor);
  const overlapWidth = Math.max(
    0,
    Math.min(position.x + physicalWidth, workArea.x + workArea.width) -
      Math.max(position.x, workArea.x),
  );
  const overlapHeight = Math.max(
    0,
    Math.min(position.y + physicalHeight, workArea.y + workArea.height) -
      Math.max(position.y, workArea.y),
  );

  return overlapWidth * overlapHeight;
};

export function resolveVisibleWindowPosition({
  fallbackPosition,
  position,
  restoreMargin = defaultRestoreMargin,
  size,
  workAreas,
}: {
  fallbackPosition: WindowPosition;
  position: WindowPosition | undefined;
  restoreMargin?: number;
  size: WindowSize;
  workAreas: WindowWorkArea[];
}): WindowPosition | undefined {
  if (!position) return undefined;

  const primaryArea = workAreas[0];
  if (!primaryArea) return position;

  const containingArea = workAreas.find((workArea) => containsPoint(workArea, position));
  const overlappingAreas = workAreas
    .map((workArea) => ({
      overlapArea: resolveOverlapArea(workArea, position, size),
      workArea,
    }))
    .filter(({ overlapArea }) => overlapArea > 0)
    .sort((left, right) => right.overlapArea - left.overlapArea);
  const targetArea = containingArea ?? overlappingAreas[0]?.workArea ?? primaryArea;
  const targetPosition =
    containingArea || overlappingAreas.length > 0 ? position : fallbackPosition;
  const scaleFactor = resolveScaleFactor(targetArea);
  const physicalMargin = Math.round(restoreMargin * scaleFactor);
  const physicalWidth = Math.round(size.width * scaleFactor);
  const physicalHeight = Math.round(size.height * scaleFactor);
  const minX = targetArea.x + physicalMargin;
  const minY = targetArea.y + physicalMargin;
  const maxX = Math.max(
    minX,
    targetArea.x + targetArea.width - physicalWidth - physicalMargin,
  );
  const maxY = Math.max(
    minY,
    targetArea.y + targetArea.height - physicalHeight - physicalMargin,
  );

  return {
    x: clampValue(targetPosition.x, minX, maxX),
    y: clampValue(targetPosition.y, minY, maxY),
  };
}

export const normalizeMiniOpacityPercent = (value: unknown) => {
  const numericValue =
    typeof value === "number" && Number.isFinite(value)
      ? Math.round(value)
      : defaultMiniOpacityPercent;

  return Math.min(maxMiniOpacityPercent, Math.max(minMiniOpacityPercent, numericValue));
};

export type StoredWindowPreferences = {
  savedIsMiniMode?: boolean;
  savedMiniSize?: Partial<WindowSize> | null;
  savedFullSize?: Partial<WindowSize> | null;
  savedMiniOpacityPercent?: number;
  savedMainPosition?: WindowPosition;
  savedMiniPosition?: WindowPosition;
  savedSettingsVersion?: number;
};

export function resolveWindowPreferences({
  savedIsMiniMode,
  savedMiniSize,
  savedFullSize,
  savedMiniOpacityPercent,
  savedMainPosition,
  savedMiniPosition,
  savedSettingsVersion,
}: StoredWindowPreferences): {
  isMiniMode: boolean;
  miniSize: WindowSize;
  fullSize: WindowSize;
  miniOpacityPercent: number;
  mainPosition?: WindowPosition;
  miniPosition?: WindowPosition;
} {
  const isCompatibleSchema =
    typeof savedSettingsVersion === "number" &&
    savedSettingsVersion >= windowSettingsSchemaVersion;

  return {
    isMiniMode: savedIsMiniMode === true,
    miniSize: isCompatibleSchema ? normalizeMiniSize(savedMiniSize) : miniDefaultSize,
    fullSize: isCompatibleSchema ? normalizeFullSize(savedFullSize) : fullWindowSize,
    miniOpacityPercent: isCompatibleSchema
      ? normalizeMiniOpacityPercent(savedMiniOpacityPercent)
      : defaultMiniOpacityPercent,
    mainPosition: savedMainPosition,
    miniPosition: savedMiniPosition,
  };
}
