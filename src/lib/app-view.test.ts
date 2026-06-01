// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { describe, expect, it } from "vitest";
import { resolveAppView, type AppViewState } from "./app-view";

const baseState: AppViewState = {
  hasCompletedOnboarding: true,
  isMiniMode: false,
  isOpacityPanelWindow: false,
  isSettingsReady: true,
  showSalaryInfo: false,
  showSettings: false,
};

describe("resolveAppView", () => {
  it("prioritizes the companion opacity window over the main shell", () => {
    expect(resolveAppView({ ...baseState, isOpacityPanelWindow: true })).toBe(
      "mini-opacity",
    );
  });

  it("keeps mini mode as a dedicated top-level view", () => {
    expect(resolveAppView({ ...baseState, isMiniMode: true, showSettings: true })).toBe(
      "mini",
    );
  });

  it("shows onboarding before regular main overlays", () => {
    expect(
      resolveAppView({
        ...baseState,
        hasCompletedOnboarding: false,
        showSettings: true,
      }),
    ).toBe("onboarding");
  });

  it("resolves low-frequency overlays after the primary views", () => {
    expect(resolveAppView({ ...baseState, showSettings: true })).toBe("settings-overlay");
    expect(resolveAppView({ ...baseState, showSalaryInfo: true })).toBe(
      "salary-info-overlay",
    );
  });
});
