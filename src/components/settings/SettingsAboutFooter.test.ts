// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

// @vitest-environment happy-dom
import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { repositoryUrl } from "../../lib/app-meta";

const opener = vi.hoisted(() => ({
  openExternalUrl: vi.fn(async () => {}),
}));

vi.mock("#opener", () => opener);
vi.mock("#updater", () => ({
  downloadAndInstall: vi.fn(async () => ({ kind: "upToDate" })),
}));

import SettingsAboutFooter from "./SettingsAboutFooter.vue";

describe("SettingsAboutFooter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    opener.openExternalUrl.mockReset();
    opener.openExternalUrl.mockResolvedValue(undefined);
  });

  it("opens the canonical repository from a semantic button", async () => {
    const wrapper = mount(SettingsAboutFooter, {
      props: { updateStatus: { kind: "upToDate" } },
    });

    await wrapper.get(".repository-button").trigger("click");

    expect(opener.openExternalUrl).toHaveBeenCalledWith(repositoryUrl);
  });

  it("renders an inline error when the repository cannot be opened", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    opener.openExternalUrl.mockRejectedValueOnce(new Error("blocked"));
    const wrapper = mount(SettingsAboutFooter, {
      props: { updateStatus: { kind: "upToDate" } },
    });

    await wrapper.get(".repository-button").trigger("click");
    await flushPromises();

    expect(wrapper.get(".about-footer__error").text()).not.toBe("");
  });
});
