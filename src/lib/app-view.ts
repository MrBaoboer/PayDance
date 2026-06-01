// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

export type AppView =
  | "mini-opacity"
  | "mini"
  | "onboarding"
  | "settings-overlay"
  | "salary-info-overlay"
  | "main";

export type AppViewState = {
  hasCompletedOnboarding: boolean;
  isMiniMode: boolean;
  isOpacityPanelWindow: boolean;
  isSettingsReady: boolean;
  showSalaryInfo: boolean;
  showSettings: boolean;
};

export const resolveAppView = ({
  hasCompletedOnboarding,
  isMiniMode,
  isOpacityPanelWindow,
  isSettingsReady,
  showSalaryInfo,
  showSettings,
}: AppViewState): AppView => {
  if (isOpacityPanelWindow) return "mini-opacity";
  if (isMiniMode) return "mini";
  if (isSettingsReady && !hasCompletedOnboarding) return "onboarding";
  if (showSettings) return "settings-overlay";
  if (showSalaryInfo) return "salary-info-overlay";
  return "main";
};
