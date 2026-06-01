// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { describe, expect, it } from "vitest";
import { trayEventNames } from "./lib/app-events";

describe("app event names", () => {
  it("keeps tray event names in one typed frontend source of truth", () => {
    expect(trayEventNames.openSettings).toBe("tray-open-settings");
    expect(trayEventNames.toggleAlwaysOnTop).toBe("tray-toggle-always-on-top");
    expect(trayEventNames.toggleMiniMode).toBe("tray-toggle-mini-mode");
  });
});
