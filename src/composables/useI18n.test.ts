// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md
// @vitest-environment happy-dom
/* eslint-disable vue/no-ref-as-operand, vue/one-component-per-file */

import { mount } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import { describe, expect, it } from "vitest";
import { provideI18n, useI18n, type Locale } from "./useI18n";

describe("provideI18n", () => {
  it("keeps the provided locale ref as the single source of truth", () => {
    const rootLocale = ref<Locale>("zh-CN");
    const changes: Locale[] = [];
    let childLocale = rootLocale;
    let setLocale: (locale: Locale) => void = () => {};

    const Child = defineComponent({
      setup() {
        const context = useI18n();
        childLocale = context.locale;
        setLocale = context.setLocale;

        return () => h("span", context.locale.value);
      },
    });
    const Provider = defineComponent({
      setup() {
        provideI18n(rootLocale, (next) => {
          changes.push(next);
        });

        return () => h(Child);
      },
    });

    mount(Provider);
    setLocale("en");

    expect(childLocale).toBe(rootLocale);
    expect(rootLocale.value).toBe("en");
    expect(changes).toEqual(["en"]);
  });
});
