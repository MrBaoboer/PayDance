// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /ADDITIONAL_TERMS.md

import { describe, expect, it } from "vitest";
import salaryInfoSheetSource from "./SalaryInfoSheet.vue?raw";

describe("salary info sheet", () => {
  it("uses the dashboard numeric font for salary explanation numbers", () => {
    const salaryInfoMoneyBlock = salaryInfoSheetSource.slice(
      salaryInfoSheetSource.indexOf(".salary-info-money {"),
      salaryInfoSheetSource.indexOf(".salary-info-money__symbol"),
    );

    expect(salaryInfoMoneyBlock).toContain("font-family: var(--font-dashboard)");
    expect(salaryInfoMoneyBlock).toContain("font-variant-numeric: tabular-nums");
    expect(salaryInfoMoneyBlock).not.toContain("font-family: var(--font-mono)");
  });

  it("uses theme-aware ink and heavier weight for salary explanation money", () => {
    const salaryInfoMoneyBlock = salaryInfoSheetSource.slice(
      salaryInfoSheetSource.indexOf(".salary-info-money {"),
      salaryInfoSheetSource.indexOf(".salary-info-money__symbol"),
    );

    expect(salaryInfoMoneyBlock).toContain("color: var(--text)");
    expect(salaryInfoMoneyBlock).toContain("font-weight: 780");
  });

  it("keeps salary cards theme-aware instead of hard-coded light surfaces", () => {
    const salaryInfoCardBlock = salaryInfoSheetSource.slice(
      salaryInfoSheetSource.indexOf(".salary-info-card {"),
      salaryInfoSheetSource.indexOf(".salary-info-card svg"),
    );

    expect(salaryInfoCardBlock).toContain("border: 1px solid var(--line)");
    expect(salaryInfoCardBlock).toContain("background: var(--panel-soft)");
    expect(salaryInfoCardBlock).not.toContain("rgb(255 255 255 / 0.9)");
  });

  it("splits money symbols for precise optical spacing", () => {
    expect(salaryInfoSheetSource).toContain("salary-info-money__symbol");
    expect(salaryInfoSheetSource).toContain("salary-info-money__value");
    expect(salaryInfoSheetSource).toContain("margin-right: 0.1em");
  });

  it("compresses the salary detail sheet in very short windows", () => {
    expect(salaryInfoSheetSource).toContain("@container (max-height: 430px)");
    expect(salaryInfoSheetSource).toContain(".salary-info-grid");
  });
});
