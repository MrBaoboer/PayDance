// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultSalaryConfig } from "../lib/salary";
import {
  defaultMiniOpacityPercent,
  fullWindowSize,
  miniDefaultSize,
} from "../lib/window-mode";

const storeMocks = {
  get: vi.fn(),
  save: vi.fn(),
  set: vi.fn(),
};

const createMockStore = () => Promise.resolve(storeMocks);

describe("useSalarySettings", () => {
  beforeEach(() => {
    storeMocks.get.mockReset();
    storeMocks.set.mockReset();
    storeMocks.save.mockReset();
  });

  it("falls back to defaults and marks settings ready when the store cannot be read", async () => {
    storeMocks.get.mockRejectedValue(new Error("corrupt settings"));

    const settings = await import("./useSalarySettings").then((module) =>
      module.useSalarySettings(createMockStore),
    );
    const {
      config,
      amountMode,
      alwaysOnTop,
      hasCompletedOnboarding,
      isSettingsReady,
      loadSettings,
      themeMode,
    } = settings;

    const windowPreferences = await loadSettings();

    expect(config.value).toEqual(defaultSalaryConfig);
    expect(alwaysOnTop.value).toBe(true);
    expect(themeMode.value).toBe("light");
    expect(amountMode.value).toBe("rolling");
    expect(hasCompletedOnboarding.value).toBe(false);
    expect(isSettingsReady.value).toBe(true);
    expect(settings).not.toHaveProperty("settingsRecoveryNotice");
    expect(storeMocks.set).toHaveBeenCalledWith("config", defaultSalaryConfig);
    expect(storeMocks.set).toHaveBeenCalledWith("settingsVersion", 4);
    expect(storeMocks.save).toHaveBeenCalled();
    expect(windowPreferences).toEqual({
      fullSize: fullWindowSize,
      isMiniMode: false,
      miniOpacityPercent: defaultMiniOpacityPercent,
      miniSize: miniDefaultSize,
    });
  });

  it("silently writes repaired persisted values back to the store", async () => {
    storeMocks.get.mockImplementation(async (key: string) => {
      if (key === "config") {
        return {
          ...defaultSalaryConfig,
          monthlySalary: 18_888,
          startTime: "99:99",
          enableLunchBreak: "invalid",
        };
      }
      if (key === "settingsVersion") return 4;
      return undefined;
    });

    const settings = await import("./useSalarySettings").then((module) =>
      module.useSalarySettings(createMockStore),
    );
    const { config, loadSettings } = settings;

    await loadSettings();

    expect(config.value.monthlySalary).toBe(18_888);
    expect(config.value.startTime).toBe(defaultSalaryConfig.startTime);
    expect(config.value.enableLunchBreak).toBe(defaultSalaryConfig.enableLunchBreak);
    expect(settings).not.toHaveProperty("settingsRecoveryNotice");
    expect(storeMocks.set).toHaveBeenCalledWith("config", config.value);
    expect(storeMocks.set).toHaveBeenCalledWith("settingsVersion", 4);
    expect(storeMocks.save).toHaveBeenCalled();
  });

  it("keeps the app usable when saving settings fails", async () => {
    storeMocks.get.mockResolvedValue(undefined);
    storeMocks.save.mockRejectedValue(new Error("disk unavailable"));

    const { isSettingsReady, loadSettings, saveSettings, settingsSaveError } =
      await import("./useSalarySettings").then((module) =>
        module.useSalarySettings(createMockStore),
      );

    await loadSettings();

    await expect(
      saveSettings({
        fullSize: fullWindowSize,
        isMiniMode: false,
        miniOpacityPercent: defaultMiniOpacityPercent,
        miniSize: miniDefaultSize,
      }),
    ).resolves.toBeUndefined();
    expect(isSettingsReady.value).toBe(true);
    expect(settingsSaveError.value).toBe("settings.saveFailed");
  });

  it("does not persist invalid salary settings while preserving UI preferences", async () => {
    storeMocks.get.mockResolvedValue(undefined);

    const { config, loadSettings, saveSettings } =
      await import("./useSalarySettings").then((module) =>
        module.useSalarySettings(createMockStore),
      );

    await loadSettings();
    storeMocks.get.mockClear();
    storeMocks.set.mockClear();
    storeMocks.save.mockClear();
    config.value = {
      ...defaultSalaryConfig,
      monthlySalary: 0,
    };

    await saveSettings({
      fullSize: { height: 520, width: 640 },
      isMiniMode: true,
      miniOpacityPercent: 64,
      miniSize: { height: 72, width: 210 },
    });

    expect(storeMocks.set).not.toHaveBeenCalledWith("config", expect.anything());
    expect(storeMocks.set).toHaveBeenCalledWith("fullSize", {
      height: 520,
      width: 640,
    });
    expect(storeMocks.set).toHaveBeenCalledWith("isMiniMode", true);
    expect(storeMocks.set).toHaveBeenCalledWith("miniOpacityPercent", 64);
    expect(storeMocks.save).toHaveBeenCalled();
  });

  it("checks the saved config after writing settings", async () => {
    storeMocks.get.mockResolvedValue(undefined);

    const { loadSettings, saveSettings } = await import("./useSalarySettings").then(
      (module) => module.useSalarySettings(createMockStore),
    );

    await loadSettings();
    storeMocks.get.mockClear();
    storeMocks.get.mockResolvedValue(defaultSalaryConfig);

    await saveSettings({
      fullSize: fullWindowSize,
      isMiniMode: false,
      miniOpacityPercent: defaultMiniOpacityPercent,
      miniSize: miniDefaultSize,
    });

    expect(storeMocks.get).toHaveBeenCalledWith("config");
  });
});
