// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /ADDITIONAL_TERMS.md

import { describe, expect, it, vi } from "vitest";
import {
  readAutostartEnabled,
  setAutostartEnabled,
  type AutostartAdapter,
} from "./autostart";

const createAdapter = (enabled: boolean): AutostartAdapter => ({
  disable: vi.fn().mockResolvedValue(undefined),
  enable: vi.fn().mockResolvedValue(undefined),
  isEnabled: vi.fn().mockResolvedValue(enabled),
});

describe("autostart", () => {
  it("reads the current autostart state", async () => {
    await expect(readAutostartEnabled(createAdapter(true))).resolves.toEqual({
      enabled: true,
      error: "",
    });
  });

  it("falls back to disabled when reading autostart state fails", async () => {
    const adapter = createAdapter(false);
    vi.mocked(adapter.isEnabled).mockRejectedValue(new Error("denied"));

    await expect(readAutostartEnabled(adapter)).resolves.toEqual({
      enabled: false,
      error: "",
    });
  });

  it("enables autostart through the adapter", async () => {
    const adapter = createAdapter(false);

    await expect(
      setAutostartEnabled(adapter, true, false, "自启动设置失败"),
    ).resolves.toEqual({
      enabled: true,
      error: "",
    });
    expect(adapter.enable).toHaveBeenCalledOnce();
    expect(adapter.disable).not.toHaveBeenCalled();
  });

  it("disables autostart through the adapter", async () => {
    const adapter = createAdapter(true);

    await expect(
      setAutostartEnabled(adapter, false, true, "自启动设置失败"),
    ).resolves.toEqual({
      enabled: false,
      error: "",
    });
    expect(adapter.disable).toHaveBeenCalledOnce();
    expect(adapter.enable).not.toHaveBeenCalled();
  });

  it("keeps the previous state and returns a short error when setting fails", async () => {
    const adapter = createAdapter(false);
    vi.mocked(adapter.enable).mockRejectedValue(new Error("blocked"));

    await expect(
      setAutostartEnabled(adapter, true, false, "自启动设置失败"),
    ).resolves.toEqual({
      enabled: false,
      error: "自启动设置失败",
    });
  });
});
