// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /ADDITIONAL_TERMS.md

// @vitest-environment happy-dom

import { describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { useWindowStatePersistence } from "./useWindowStatePersistence";
import type { PersistedWindowState } from "./useSalarySettings";

const defaultState: PersistedWindowState = {
  fullSize: { height: 460, width: 480 },
  isMiniMode: false,
  miniOpacityPercent: 100,
  miniSize: { height: 82, width: 210 },
};

const createDeferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((next) => {
    resolve = next;
  });
  return { promise, resolve };
};

describe("useWindowStatePersistence", () => {
  it("serializes overlapping saves and persists the latest state", async () => {
    const fullSize = ref({ height: 460, width: 480 });
    const miniSize = ref({ height: 82, width: 210 });
    const isMiniMode = ref(false);
    const miniOpacityPercent = ref(100);
    const mainPosition = ref(undefined);
    const miniPosition = ref(undefined);
    const firstWrite = createDeferred();
    const savedStates: PersistedWindowState[] = [];
    const saveSettings = vi.fn((state: PersistedWindowState) => {
      savedStates.push(JSON.parse(JSON.stringify(state)) as PersistedWindowState);
      return savedStates.length === 1 ? firstWrite.promise : Promise.resolve();
    });

    const { saveStateNow } = useWindowStatePersistence({
      defaultWindowPreferences: defaultState,
      fullSize,
      isMiniMode,
      isSettingsReady: ref(true),
      loadSettings: vi.fn(),
      mainPosition,
      miniOpacityPercent,
      miniPosition,
      miniSize,
      saveSettings,
    });

    const firstSave = saveStateNow();
    isMiniMode.value = true;
    miniOpacityPercent.value = 64;
    miniSize.value = { height: 90, width: 230 };
    const secondSave = saveStateNow();

    expect(saveSettings).toHaveBeenCalledTimes(1);
    firstWrite.resolve();
    await Promise.all([firstSave, secondSave]);

    expect(saveSettings).toHaveBeenCalledTimes(2);
    expect(savedStates[savedStates.length - 1]).toMatchObject({
      isMiniMode: true,
      miniOpacityPercent: 64,
      miniSize: { height: 90, width: 230 },
    });
  });
});
