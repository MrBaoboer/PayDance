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

  it("surfaces signature and manifest startup errors while keeping startup network errors quiet", () => {
    const sigWrapper = mount(SettingsAboutFooter, {
      props: {
        updateStatus: {
          kind: "error",
          message: "Update signature verification failed",
          reason: "signature-verification",
        },
      },
    });
    expect(sigWrapper.find(".update-badge-button--error").exists()).toBe(true);
    expect(sigWrapper.get(".update-badge-button--error").attributes("title")).toBe(
      "签名校验失败，点击重试",
    );

    const netWrapper = mount(SettingsAboutFooter, {
      props: {
        updateStatus: {
          kind: "error",
          message: "offline",
          reason: "network",
        },
      },
    });
    expect(netWrapper.find(".update-badge-button--error").exists()).toBe(false);
  });

  it("shows concise icon tooltips for up-to-date and error states without appending a footer banner", async () => {
    const onCheckUpdate = vi.fn(async () => ({ kind: "upToDate" as const }));
    const wrapper = mount(SettingsAboutFooter, {
      props: {
        onCheckUpdate,
        updateStatus: { kind: "upToDate" },
      },
    });

    await wrapper.get(".update-badge-button").trigger("click");
    await flushPromises();

    expect(onCheckUpdate).toHaveBeenCalledTimes(1);
    expect(wrapper.find(".about-footer__notice").exists()).toBe(false);
    expect(wrapper.get(".update-badge--ok").attributes("title")).toBe("已是最新版本");

    const errorWrapper = mount(SettingsAboutFooter, {
      props: {
        updateStatus: {
          kind: "error",
          message: "Install directory is not writable",
          reason: "permission",
        },
      },
    });
    await flushPromises();

    expect(errorWrapper.find(".about-footer__notice").exists()).toBe(false);
    expect(errorWrapper.get(".update-badge-button--error").attributes("title")).toBe(
      "目录不可写，点击重试",
    );
  });
});
