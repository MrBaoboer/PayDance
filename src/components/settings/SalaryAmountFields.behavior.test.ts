// @vitest-environment happy-dom
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { defaultSalaryConfig } from "../../lib/salary";
import SalaryAmountFields from "./SalaryAmountFields.vue";
import SalaryModeControl from "./SalaryModeControl.vue";

const mountSalaryAmountFields = (
  config = defaultSalaryConfig,
  hasIssue: () => boolean = () => false,
) =>
  mount(SalaryAmountFields, {
    props: {
      config: { ...config, workdays: [...config.workdays] },
      density: "settings",
      hasIssue,
    },
  });

describe("SalaryAmountFields", () => {
  it("keeps salary mode options in a three-column row", () => {
    const wrapper = mount(SalaryModeControl, {
      props: {
        density: "onboarding",
        modelValue: "monthly",
      },
    });

    expect(wrapper.classes()).toContain("segmented-control");
    expect(wrapper.attributes("role")).toBe("radiogroup");
    expect(wrapper.findAll("button").map((button) => button.text())).toEqual([
      "月薪",
      "日薪",
      "时薪",
    ]);
  });

  it("shows monthly salary and monthly work days in monthly mode", () => {
    const wrapper = mountSalaryAmountFields();

    expect(wrapper.findAll('input[type="number"]')).toHaveLength(2);
    expect(wrapper.text()).toContain("月薪");
    expect(wrapper.text()).toContain("每月工作天数");
  });

  it("shows only daily salary in daily mode", () => {
    const wrapper = mountSalaryAmountFields({
      ...defaultSalaryConfig,
      salaryType: "daily",
    });

    expect(wrapper.findAll('input[type="number"]')).toHaveLength(1);
    expect(wrapper.text()).toContain("日薪");
    expect(wrapper.text()).not.toContain("每月工作天数");
  });

  it("emits a config update when salary input changes", async () => {
    const wrapper = mountSalaryAmountFields();

    await wrapper.get('input[type="number"]').setValue("9000");

    expect(wrapper.emitted("update:config")?.[0]?.[0]).toMatchObject({
      monthlySalary: 9000,
    });
  });
});
