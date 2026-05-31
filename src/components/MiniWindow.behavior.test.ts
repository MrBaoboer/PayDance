// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /ADDITIONAL_TERMS.md

// @vitest-environment happy-dom
import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import MiniWindow from "./MiniWindow.vue";

describe("MiniWindow behavior", () => {
  it("captures the visual anchor before emitting the opacity menu request", async () => {
    const wrapper = mount(MiniWindow, {
      props: {
        amount: "330.29",
        amountMode: "plain",
        opacityPercent: 100,
      },
      global: {
        stubs: {
          RollingAmount: {
            props: ["value"],
            template: "<span>{{ value }}</span>",
          },
        },
      },
    });
    const miniWindow = wrapper.get(".mini-window");
    vi.spyOn(miniWindow.element, "getBoundingClientRect").mockReturnValue({
      bottom: 76,
      height: 72,
      left: 4,
      right: 214,
      top: 4,
      width: 210,
      x: 4,
      y: 4,
      toJSON: () => ({}),
    });

    await miniWindow.trigger("contextmenu", {
      clientX: 184,
      clientY: 30,
      screenX: 424,
      screenY: 190,
    });

    expect(wrapper.emitted("opacityMenu")?.[0]).toEqual([
      {
        clientPoint: { x: 184, y: 30 },
        screenPoint: { x: 424, y: 190 },
        targetRect: { height: 72, width: 210, x: 4, y: 4 },
      },
    ]);
  });

  it("exposes Enter and Space restore paths for the mini window", async () => {
    const wrapper = mount(MiniWindow, {
      props: {
        amount: "330.29",
        amountMode: "plain",
        opacityPercent: 100,
      },
      global: {
        stubs: {
          RollingAmount: {
            props: ["value"],
            template: "<span>{{ value }}</span>",
          },
        },
      },
    });

    await wrapper.get(".mini-window").trigger("keydown", { key: "Enter" });
    await wrapper.get(".mini-window").trigger("keydown", { key: " " });

    expect(wrapper.emitted("restore")).toHaveLength(2);
  });
});
