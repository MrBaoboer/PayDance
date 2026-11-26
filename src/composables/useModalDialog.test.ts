// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

// @vitest-environment happy-dom
import { mount } from "@vue/test-utils";
import { defineComponent, h, nextTick, ref } from "vue";
import { describe, expect, it, vi } from "vitest";
import { useModalDialog } from "./useModalDialog";

describe("useModalDialog", () => {
  it("focuses the first control once an asynchronously mounted modal renders its children", async () => {
    const isOpen = ref(false);
    const hasAsyncContent = ref(false);
    const onEscape = vi.fn();

    const Host = defineComponent({
      setup() {
        const dialogRef = ref<HTMLElement | null>(null);
        useModalDialog({ containerRef: dialogRef, isOpen, onEscape });

        return () =>
          h("div", [
            h("button", { class: "trigger", type: "button" }, "Open"),
            isOpen.value
              ? h(
                  "div",
                  { class: "dialog-host", ref: dialogRef },
                  hasAsyncContent.value
                    ? [
                        h("button", { class: "first-btn", type: "button" }, "First"),
                        h("button", { class: "last-btn", type: "button" }, "Last"),
                      ]
                    : [],
                )
              : null,
          ]);
      },
    });

    const wrapper = mount(Host, { attachTo: document.body });
    const trigger = wrapper.get(".trigger").element as HTMLButtonElement;
    trigger.focus();

    isOpen.value = true;
    await nextTick();
    await nextTick();
    expect(document.activeElement).toBe(trigger);

    hasAsyncContent.value = true;
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(document.activeElement).toBe(wrapper.get(".first-btn").element);

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(onEscape).toHaveBeenCalledTimes(1);

    isOpen.value = false;
    await nextTick();
    await nextTick();
    expect(document.activeElement).toBe(trigger);

    wrapper.unmount();
  });
});
