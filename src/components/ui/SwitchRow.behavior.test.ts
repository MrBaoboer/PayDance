// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

// @vitest-environment happy-dom
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { nextTick } from "vue";
import SwitchRow from "./SwitchRow.vue";

const mountSwitch = (modelValue = false) =>
  mount(SwitchRow, { props: { label: "开机自动启动", modelValue } });

describe("SwitchRow", () => {
  it("emits the clicked state and follows the parent once it accepts", async () => {
    const wrapper = mountSwitch();
    const input = wrapper.get("input");

    await input.setValue(true);
    expect(wrapper.emitted("update:modelValue")).toEqual([[true]]);

    await wrapper.setProps({ modelValue: true });
    await nextTick();
    expect((input.element as HTMLInputElement).checked).toBe(true);
  });

  it("snaps back when the parent keeps the old value", async () => {
    const wrapper = mountSwitch();
    const input = wrapper.get("input");

    await input.setValue(true);
    await nextTick();

    expect((input.element as HTMLInputElement).checked).toBe(false);
  });
});
