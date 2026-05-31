// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /ADDITIONAL_TERMS.md

// @vitest-environment happy-dom
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { defaultSalaryConfig } from "../../lib/salary";
import LunchBreakFields from "./LunchBreakFields.vue";

const mountLunchBreakFields = (
  variant: "settings" | "onboarding",
  enableLunchBreak = false,
) =>
  mount(LunchBreakFields, {
    props: {
      config: {
        ...defaultSalaryConfig,
        enableLunchBreak,
        workdays: [...defaultSalaryConfig.workdays],
      },
      density: variant,
      hasIssue: () => false,
      variant,
    },
  });

describe("LunchBreakFields", () => {
  it("keeps disabled time fields visible in settings", () => {
    const wrapper = mountLunchBreakFields("settings", false);

    expect(wrapper.text()).toContain("午休");
    expect(wrapper.findAll('input[type="time"]')).toHaveLength(2);
    expect(
      wrapper
        .findAll<HTMLInputElement>('input[type="time"]')
        .every((input) => input.element.disabled),
    ).toBe(true);
  });

  it("keeps lunch time fields hidden in onboarding until lunch exclusion is enabled", async () => {
    const wrapper = mountLunchBreakFields("onboarding", false);

    expect(wrapper.text()).toContain("剔除午休");
    expect(wrapper.findAll('input[type="time"]')).toHaveLength(0);

    await wrapper.get('input[type="checkbox"]').setValue(true);

    expect(wrapper.emitted("update:config")?.[0]?.[0]).toMatchObject({
      enableLunchBreak: true,
    });
  });
});
