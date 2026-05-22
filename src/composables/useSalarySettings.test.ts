import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultSalaryConfig } from "../lib/salary";
import { defaultMiniOpacityPercent, fullWindowSize, miniDefaultSize } from "../lib/window-mode";

const storeMocks = vi.hoisted(() => ({
  get: vi.fn(),
  save: vi.fn(),
  set: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-store", () => ({
  LazyStore: vi.fn(function LazyStore() {
    return storeMocks;
  }),
}));

describe("useSalarySettings", () => {
  beforeEach(() => {
    storeMocks.get.mockReset();
    storeMocks.set.mockReset();
    storeMocks.save.mockReset();
  });

  it("falls back to defaults and marks settings ready when the store cannot be read", async () => {
    storeMocks.get.mockRejectedValue(new Error("corrupt settings"));

    const { config, amountMode, alwaysOnTop, hasCompletedOnboarding, isSettingsReady, loadSettings, themeMode } =
      await import("./useSalarySettings").then((module) => module.useSalarySettings());

    const windowPreferences = await loadSettings();

    expect(config.value).toEqual(defaultSalaryConfig);
    expect(alwaysOnTop.value).toBe(true);
    expect(themeMode.value).toBe("light");
    expect(amountMode.value).toBe("rolling");
    expect(hasCompletedOnboarding.value).toBe(false);
    expect(isSettingsReady.value).toBe(true);
    expect(windowPreferences).toEqual({
      fullSize: fullWindowSize,
      isMiniMode: false,
      miniOpacityPercent: defaultMiniOpacityPercent,
      miniSize: miniDefaultSize,
    });
  });
});
