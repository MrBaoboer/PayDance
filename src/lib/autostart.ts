// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /ADDITIONAL_TERMS.md

import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";

export type AutostartAdapter = {
  disable: () => Promise<void>;
  enable: () => Promise<void>;
  isEnabled: () => Promise<boolean>;
};

export type AutostartResult = {
  enabled: boolean;
  error: string;
};

export const tauriAutostartAdapter: AutostartAdapter = {
  disable,
  enable,
  isEnabled,
};

export async function readAutostartEnabled(
  adapter: AutostartAdapter,
): Promise<AutostartResult> {
  try {
    return {
      enabled: await adapter.isEnabled(),
      error: "",
    };
  } catch (error) {
    console.error("Failed to read autostart state", error);
    return {
      enabled: false,
      error: "",
    };
  }
}

export async function setAutostartEnabled(
  adapter: AutostartAdapter,
  enabled: boolean,
  previousEnabled: boolean,
  errorMessage: string,
): Promise<AutostartResult> {
  try {
    if (enabled) {
      await adapter.enable();
    } else {
      await adapter.disable();
    }

    return {
      enabled,
      error: "",
    };
  } catch (error) {
    console.error("Failed to update autostart state", error);
    return {
      enabled: previousEnabled,
      error: errorMessage,
    };
  }
}
