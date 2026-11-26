// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

// @vitest-environment happy-dom
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import type { SalaryStatus } from "../lib/salary";
import WindowTitlebar from "./WindowTitlebar.vue";

const mountTitlebar = (
  props: {
    availableUpdateVersion?: string;
    hasConfigIssues?: boolean;
    isNightWork?: boolean;
    showDesktopActions?: boolean;
    status?: SalaryStatus;
  } = {},
) =>
  mount(WindowTitlebar, {
    props: {
      alwaysOnTop: false,
      hasConfigIssues: false,
      statusText: "正在上班",
      themeMode: "light",
      ...props,
    },
  });

const dotClass = (wrapper: ReturnType<typeof mountTitlebar>) =>
  wrapper
    .get(".status-dot")
    .classes()
    .find((className) => className.startsWith("status-dot--"));

describe("WindowTitlebar status dot", () => {
  it.each([
    ["working", false, "status-dot--working"],
    ["working", true, "status-dot--night"],
    ["lunch-break", false, "status-dot--break"],
    ["before-work", false, "status-dot--waiting"],
    ["after-work", false, "status-dot--done"],
    ["after-work", true, "status-dot--done"],
    ["rest-day", false, "status-dot--idle"],
    ["invalid-config", false, "status-dot--invalid"],
  ] as const)("colours %s (night shift: %s) with %s", (status, isNightWork, expected) => {
    expect(dotClass(mountTitlebar({ isNightWork, status }))).toBe(expected);
  });

  it("shows the invalid colour whenever the config has issues and lets users jump to settings", async () => {
    const wrapper = mountTitlebar({ hasConfigIssues: true, status: "working" });

    expect(dotClass(wrapper)).toBe("status-dot--invalid");
    await wrapper.get("button.status-chip").trigger("click");
    expect(wrapper.emitted("toggleSettings")).toHaveLength(1);
  });

  it("shows a quiet update dot on the desktop settings button only when an update is available", () => {
    const upToDate = mountTitlebar({ availableUpdateVersion: "" });
    expect(upToDate.find(".settings-update-dot").exists()).toBe(false);

    const hasUpdate = mountTitlebar({ availableUpdateVersion: "0.10.1" });
    expect(hasUpdate.find(".settings-update-dot").exists()).toBe(true);
    expect(hasUpdate.get(".icon-button--settings").attributes("title")).toContain(
      "0.10.1",
    );

    const webPreview = mountTitlebar({
      availableUpdateVersion: "0.10.1",
      showDesktopActions: false,
    });
    expect(webPreview.find(".settings-update-dot").exists()).toBe(false);
  });
});
