// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

// @vitest-environment happy-dom

import { describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { fullWindowSize } from "../lib/window-mode";
import { useAppShell } from "./useAppShell";

const createShell = (initialMiniMode = false) => {
  const events: string[] = [];
  const isMiniMode = ref(initialMiniMode);
  const captureWindowPosition = vi.fn(async () => {
    events.push(`capture:${isMiniMode.value ? "mini" : "main"}`);
  });
  const applyWindowMode = vi.fn(async () => {
    events.push(`apply:${isMiniMode.value ? "mini" : "main"}`);
  });
  const restoreWindowPosition = vi.fn(async () => {
    events.push(`restore:${isMiniMode.value ? "mini" : "main"}`);
  });
  const readWindowPosition = vi.fn((miniMode: boolean) =>
    miniMode ? { x: 900, y: 80 } : { x: 120, y: 160 },
  );
  const saveStateNow = vi.fn(async () => {
    events.push("save");
  });

  const shell = useAppShell({
    alwaysOnTop: ref(false),
    appWindow: {
      setFocus: vi.fn(async () => undefined),
      show: vi.fn(async () => undefined),
    },
    applyThemeMode: vi.fn(async () => undefined),
    applyWindowMode,
    captureWindowPosition,
    fullSize: ref({ ...fullWindowSize }),
    hasCompletedOnboarding: ref(true),
    isMiniMode,
    isOpacityPanelWindow: false,
    isSettingsReady: ref(true),
    readWindowPosition,
    restoreWindowPosition,
    saveStateNow,
    setAlwaysOnTop: vi.fn(async () => undefined),
    themeMode: ref("light"),
  });

  return {
    events,
    isMiniMode,
    restoreWindowPosition,
    shell,
  };
};

describe("useAppShell window mode transitions", () => {
  it("captures the full window before resizing and restoring the mini position", async () => {
    const { events, restoreWindowPosition, shell } = createShell(false);

    await shell.setMiniMode(true);

    expect(events).toEqual(["capture:main", "apply:mini", "restore:mini", "save"]);
    expect(restoreWindowPosition).toHaveBeenCalledWith({ x: 900, y: 80 });
  });

  it("uses the same position transition when settings restore the full window", async () => {
    const { events, shell } = createShell(true);

    await shell.openSettings();

    expect(events).toEqual(["capture:mini", "apply:main", "restore:main", "save"]);
  });
});
