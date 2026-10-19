// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

// @vitest-environment happy-dom
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { defineComponent, h, ref } from "vue";
import { provideCurrency } from "../composables/useCurrency";
import MainDashboard from "./MainDashboard.vue";
import MiniWindow from "./MiniWindow.vue";

// Both hosts hide RollingAmount from assistive tech and name themselves with visually hidden
// text. If the amount is missing from that text, the number this whole product exists to show
// is unreachable with a screen reader.
const snapshot = {
  dailySalary: 800,
  earnedToday: 128.48,
  elapsedWorkMs: 0,
  hourlyRate: 100,
  isNightWork: false,
  isWorking: true,
  minuteRate: 1.67,
  nextTransitionMs: 0,
  progress: 0.5,
  secondRate: 0.028,
  status: "working" as const,
};

const mountWithCurrency = (symbol: string, component: unknown, props: object) =>
  mount(
    defineComponent({
      setup() {
        provideCurrency(ref(symbol));
        return () => h(component as never, props);
      },
    }),
  );

const accessibleName = (wrapper: ReturnType<typeof mount>, selector: string) => {
  const host = wrapper.get(selector);
  // An aria-label would override the hidden text, and axe fails it against the digit strips.
  expect(host.attributes("aria-label")).toBeUndefined();
  expect(host.get(".rolling-amount").attributes("aria-hidden")).toBe("true");
  return host.get(".sr-only").text();
};

describe("live amount accessible names", () => {
  it("puts today's earnings into the main dashboard button label", () => {
    const wrapper = mountWithCurrency("¥", MainDashboard, {
      amountMode: "rolling",
      dailyEarnText: "800.00",
      earnedText: "128.48",
      middleStat: { label: "距离下班", value: "3h" },
      snapshot,
      suspendAmountPulse: false,
      workedTimeText: "5h",
    });

    expect(accessibleName(wrapper, ".amount-display")).toContain("¥128.48");
  });

  it("puts the amount into the mini window label", () => {
    const wrapper = mountWithCurrency("$", MiniWindow, {
      amount: "128.48",
      amountMode: "rolling",
      opacityPercent: 85,
    });

    expect(accessibleName(wrapper, ".mini-window")).toContain("$128.48");
  });

  it("omits the symbol from the label when the user hid it", () => {
    const wrapper = mountWithCurrency("", MiniWindow, {
      amount: "128.48",
      amountMode: "rolling",
      opacityPercent: 85,
    });

    const label = accessibleName(wrapper, ".mini-window");
    expect(label).toContain("128.48");
    expect(label).not.toContain("¥");
  });
});
