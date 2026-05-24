import { describe, expect, it } from "vitest";
import { trayEventNames } from "./lib/app-events";

describe("app event names", () => {
  it("keeps tray event names in one typed frontend source of truth", () => {
    expect(trayEventNames.openSettings).toBe("tray-open-settings");
    expect(trayEventNames.toggleAlwaysOnTop).toBe("tray-toggle-always-on-top");
    expect(trayEventNames.toggleMiniMode).toBe("tray-toggle-mini-mode");
  });
});
