// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /ADDITIONAL_TERMS.md

import { ref } from "vue";
import { describe, expect, it } from "vitest";
import { fullWindowSize, miniDefaultSize } from "../lib/window-mode";
import { useWindowMode } from "./useWindowMode";

const createManagedWindow = () => {
  const alwaysOnTopCalls: boolean[] = [];
  const sizeCalls: Array<{ width: number; height: number }> = [];

  return {
    alwaysOnTopCalls,
    sizeCalls,
    window: {
      setAlwaysOnTop: async (value: boolean) => {
        alwaysOnTopCalls.push(value);
      },
      setMinSize: async () => {},
      setResizable: async () => {},
      setSize: async (size: { width: number; height: number }) => {
        sizeCalls.push({ width: size.width, height: size.height });
      },
    },
  };
};

const lastCall = <Value>(calls: Value[]) => calls[calls.length - 1];

describe("useWindowMode", () => {
  it("keeps the full-window topmost preference when mini mode applies topmost", async () => {
    const managedWindow = createManagedWindow();
    const isMiniMode = ref(false);
    const miniSize = ref({ ...miniDefaultSize });
    const fullSize = ref({ ...fullWindowSize });
    const alwaysOnTop = ref(false);
    const { applyWindowMode } = useWindowMode(
      managedWindow.window,
      isMiniMode,
      miniSize,
      fullSize,
      alwaysOnTop,
    );

    isMiniMode.value = true;
    await applyWindowMode();

    expect(lastCall(managedWindow.alwaysOnTopCalls)).toBe(true);
    expect(alwaysOnTop.value).toBe(false);

    isMiniMode.value = false;
    await applyWindowMode();

    expect(lastCall(managedWindow.alwaysOnTopCalls)).toBe(false);
  });

  it("updates full-window topmost preference from mini mode while keeping mini mode topmost", async () => {
    const managedWindow = createManagedWindow();
    const isMiniMode = ref(true);
    const miniSize = ref({ ...miniDefaultSize });
    const fullSize = ref({ ...fullWindowSize });
    const alwaysOnTop = ref(true);
    const { setAlwaysOnTop } = useWindowMode(
      managedWindow.window,
      isMiniMode,
      miniSize,
      fullSize,
      alwaysOnTop,
    );

    await setAlwaysOnTop(false);

    expect(alwaysOnTop.value).toBe(false);
    expect(lastCall(managedWindow.alwaysOnTopCalls)).toBe(true);
  });

  it("restores the saved full-window size when leaving mini mode", async () => {
    const managedWindow = createManagedWindow();
    const isMiniMode = ref(false);
    const miniSize = ref({ ...miniDefaultSize });
    const fullSize = ref({ width: 720, height: 540 });
    const alwaysOnTop = ref(true);
    const { applyWindowMode } = useWindowMode(
      managedWindow.window,
      isMiniMode,
      miniSize,
      fullSize,
      alwaysOnTop,
    );

    await applyWindowMode();

    expect(lastCall(managedWindow.sizeCalls)).toEqual({ width: 720, height: 540 });
  });
});
