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

  it("uses the main amount ink color and heavier weight for salary explanation money", () => {
    const salaryInfoMoneyBlock = salaryInfoSheetSource.slice(
      salaryInfoSheetSource.indexOf(".salary-info-money {"),
      salaryInfoSheetSource.indexOf(".salary-info-money__symbol"),
    );

    expect(salaryInfoMoneyBlock).toContain("color: #18181B");
    expect(salaryInfoMoneyBlock).toContain("font-weight: 780");
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
