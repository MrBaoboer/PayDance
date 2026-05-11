import { describe, expect, it } from "vitest";
import { appName, repositoryUrl } from "./app-meta";

describe("app metadata", () => {
  it("uses the current product name without legacy wording", () => {
    expect(appName).toBe("高级牛马工资实时计算器");
    expect(appName).not.toContain("社畜");
  });

  it("records the project repository", () => {
    expect(repositoryUrl).toBe("https://github.com/MasterBao66/Labor-Wage-Live-Calc");
  });
});
