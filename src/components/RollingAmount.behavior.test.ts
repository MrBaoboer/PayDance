// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

// @vitest-environment happy-dom
import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";
import RollingAmount from "./RollingAmount.vue";

describe("RollingAmount behavior", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("adds a visible pulse while the hero amount changes", async () => {
    const wrapper = mount(RollingAmount, {
      props: {
        mode: "rolling",
        value: "128.47",
        variant: "hero",
      },
    });

    await wrapper.setProps({ value: "128.48" });
    await nextTick();

    expect(wrapper.classes()).toContain("is-ticking");
    expect(wrapper.attributes("aria-label")).toBe("¥128.48");

    vi.advanceTimersByTime(240);
    await nextTick();

    expect(wrapper.classes()).not.toContain("is-ticking");
  });

  it("scales down long high-denomination amounts so digits stay within bounds", () => {
    const normal = mount(RollingAmount, {
      props: { mode: "rolling", value: "34.97", variant: "hero" },
    });
    const wide = mount(RollingAmount, {
      props: { mode: "rolling", value: "250000.00", variant: "hero" },
    });

    expect(
      Number(normal.attributes("style")?.match(/--amount-scale:\s*([\d.]+)/)?.[1]),
    ).toBe(1);
    expect(
      Number(wide.attributes("style")?.match(/--amount-scale:\s*([\d.]+)/)?.[1]),
    ).toBeLessThan(0.9);
  });

  it("never triggers digit roll transitions on mount and only rolls digits whose value changed", async () => {
    const wrapper = mount(RollingAmount, {
      props: {
        mode: "rolling",
        value: "128.47",
        variant: "mini",
      },
    });

    // Initial mount (including switching into/out of mini mode) must stay visually still.
    expect(wrapper.findAll(".is-digit-rolling")).toHaveLength(0);

    await wrapper.setProps({ value: "128.48" });
    await nextTick();

    const rollingStrips = wrapper.findAll(".is-digit-rolling");
    expect(rollingStrips).toHaveLength(1);

    vi.advanceTimersByTime(280);
    await nextTick();

    expect(wrapper.findAll(".is-digit-rolling")).toHaveLength(0);
  });

  it("does not truncate an adjacent rolling column when a faster tick updates a lower digit", async () => {
    const wrapper = mount(RollingAmount, {
      props: {
        mode: "rolling",
        value: "128.49",
        variant: "hero",
      },
    });

    await wrapper.setProps({ value: "128.50" });
    await nextTick();
    expect(wrapper.findAll(".is-digit-rolling")).toHaveLength(2);

    // 120ms later only the hundredths digit changes; tenths must still finish its 280ms roll.
    vi.advanceTimersByTime(120);
    await wrapper.setProps({ value: "128.51" });
    await nextTick();
    expect(wrapper.findAll(".is-digit-rolling")).toHaveLength(2);

    // At 280ms total, tenths finishes cleanly while hundredths still rolls until 400ms.
    vi.advanceTimersByTime(160);
    await nextTick();
    expect(wrapper.findAll(".is-digit-rolling")).toHaveLength(1);

    vi.advanceTimersByTime(120);
    await nextTick();
    expect(wrapper.findAll(".is-digit-rolling")).toHaveLength(0);
  });
});
