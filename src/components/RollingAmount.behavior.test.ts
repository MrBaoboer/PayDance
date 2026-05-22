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
});
