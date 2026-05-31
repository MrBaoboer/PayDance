export type ThemeMode = "light" | "dark";

export type WindowSize = {
  width: number;
  height: number;
};

export type WindowPosition = {
  x: number;
  y: number;
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
