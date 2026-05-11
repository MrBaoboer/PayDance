export type ThemeMode = "light" | "dark";

export type WindowSize = {
  width: number;
  height: number;
};

export const currentSettingsSchemaVersion = 2;

export const fullWindowSize: WindowSize = { width: 480, height: 460 };
export const fullWindowMinSize: WindowSize = { width: 430, height: 410 };
export const miniDefaultSize: WindowSize = { width: 176, height: 54 };
export const miniMinSize: WindowSize = { width: 148, height: 44 };
export const miniResizeEdgeSize = 10;

export const normalizeMiniSize = (
  size: Partial<WindowSize> | null | undefined,
): WindowSize => ({
  width: Math.max(miniMinSize.width, Math.round(size?.width ?? miniDefaultSize.width)),
  height: Math.max(miniMinSize.height, Math.round(size?.height ?? miniDefaultSize.height)),
});

export type StoredWindowPreferences = {
  savedIsMiniMode?: boolean;
  savedMiniSize?: Partial<WindowSize> | null;
  savedSettingsVersion?: number;
};

export function resolveWindowPreferences({
  savedIsMiniMode,
  savedMiniSize,
  savedSettingsVersion,
}: StoredWindowPreferences): {
  isMiniMode: boolean;
  miniSize: WindowSize;
} {
  const isCurrentSchema = savedSettingsVersion === currentSettingsSchemaVersion;

  return {
    isMiniMode: savedIsMiniMode === true,
    miniSize: isCurrentSchema ? normalizeMiniSize(savedMiniSize) : miniDefaultSize,
  };
}
