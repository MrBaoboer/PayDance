// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

// @vitest-environment happy-dom
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { defaultSalaryConfig } from "../lib/salary";
import OnboardingPanel from "./OnboardingPanel.vue";

const mountOnboardingPanel = () =>
  mount(OnboardingPanel, {
    props: {
      alwaysOnTop: true,
      autostartEnabled: false,
      config: {
        ...defaultSalaryConfig,
        workdays: [...defaultSalaryConfig.workdays],
      },
      themeMode: "light",
    },
  });

describe("OnboardingPanel behavior", () => {
  it("keeps lunch time fields hidden until lunch exclusion is enabled", async () => {
    const wrapper = mountOnboardingPanel();

    await wrapper.get(".primary-button").trigger("click");

    expect(wrapper.text()).toContain("剔除午休");
    expect(wrapper.findAll('input[type="time"]')).toHaveLength(2);

    await wrapper.get('input[type="checkbox"]').setValue(true);

    expect(wrapper.emitted("update:config")?.[0]?.[0]).toMatchObject({
      enableLunchBreak: true,
    });
  });

  it("emits theme preference changes from the usage preference step", async () => {
    const wrapper = mountOnboardingPanel();

    await wrapper.get(".primary-button").trigger("click");
    await wrapper.get(".primary-button").trigger("click");
    await wrapper
      .findAll(".segmented-control button")
      .find((button) => button.text() === "深色")
      ?.trigger("click");

    expect(wrapper.emitted("update:themeMode")?.[0]).toEqual(["dark"]);
  });
});
