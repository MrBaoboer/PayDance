// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { describe, expect, it } from "vitest";
import updaterSource from "./updater.ts?raw";
import { classifyUpdateError } from "./updater";

describe("updater error classification", () => {
  it("keeps development updater config gaps unavailable", () => {
    expect(classifyUpdateError(new Error("missing pubkey"), false)).toEqual({
      kind: "unavailable",
      reason: "dev-config",
    });
  });

  it("treats production signature failures as hard update errors", () => {
    expect(classifyUpdateError(new Error("signature verification failed"), true)).toEqual(
      {
        kind: "error",
        message: "Update signature verification failed",
        reason: "signature-verification",
      },
    );
  });

  it("separates invalid manifests from generic network failures", () => {
    expect(classifyUpdateError(new Error("manifest missing platforms"), true)).toEqual({
      kind: "error",
      message: "Update manifest is invalid",
      reason: "manifest-invalid",
    });
    expect(classifyUpdateError(new Error("network timeout"), true)).toEqual({
      kind: "error",
      message: "network timeout",
      reason: "network",
    });
  });

  it("uses the PayDance portable updater instead of executing the exe as an installer", () => {
    expect(updaterSource).toContain(
      'invoke<PortableUpdateResult>("install_portable_update")',
    );
    expect(updaterSource).not.toContain("update.downloadAndInstall");
    expect(updaterSource).not.toContain("@tauri-apps/plugin-process");
  });
});
