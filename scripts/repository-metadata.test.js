import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path) => readFileSync(resolve(import.meta.dirname, "..", path), "utf8");

describe("repository metadata", () => {
  it("keeps issue template version hints aligned with the current release line", () => {
    expect(read(".github/ISSUE_TEMPLATE.md")).not.toContain("v0.5.15");
    expect(read(".github/ISSUE_TEMPLATE/bug_report.yml")).not.toContain("v0.5.15");
    expect(read(".github/ISSUE_TEMPLATE.md")).toContain("v0.8.7");
    expect(read(".github/ISSUE_TEMPLATE/bug_report.yml")).toContain("v0.8.7");
  });

  it("records macOS as the next desktop migration direction without overpromising packages", () => {
    const productSource = read("PRODUCT.md");

    expect(productSource).toContain("macOS");
    expect(productSource).toContain("下一阶段");
    expect(productSource).toContain(
      "不代表当前 Windows 便携版可以直接变成其他平台安装包",
    );
  });
});
