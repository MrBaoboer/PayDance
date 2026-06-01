// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { describe, expect, it } from "vitest";
import salaryAmountFieldsSource from "./SalaryAmountFields.vue?raw";
import workTimeFieldsSource from "./WorkTimeFields.vue?raw";
import lunchBreakFieldsSource from "./LunchBreakFields.vue?raw";

const fieldSources = [
  salaryAmountFieldsSource,
  workTimeFieldsSource,
  lunchBreakFieldsSource,
];

describe("shared setting field focus styles", () => {
  it("keeps text inputs locally focused without the orange global input caret line", () => {
    fieldSources.forEach((source) => {
      expect(source).toContain("caret-color: var(--text)");
      expect(source).toContain("border-color: var(--field-focus-border)");
      expect(source).toContain("box-shadow: 0 0 0 3px var(--field-focus-ring)");
      expect(source).not.toContain("border-color: var(--accent)");
    });
  });
});
