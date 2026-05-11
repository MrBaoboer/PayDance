import { describe, expect, it } from "vitest";
import { appEnglishName, appName, appTagline, repositoryUrl } from "./app-meta";

describe("app metadata", () => {
  it("uses the PayDance brand without legacy wording", () => {
    expect(appName).toBe("薪跳");
    expect(appEnglishName).toBe("PayDance");
    expect(appTagline).toBe("桌面实时薪资仪表盘");
  });

  it("records the project repository", () => {
    expect(repositoryUrl).toBe("https://github.com/MasterBao66/PayDance");
  });
});
