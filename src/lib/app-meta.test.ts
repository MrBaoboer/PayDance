import { describe, expect, it } from "vitest";
import {
  appAuthor,
  appCopyright,
  appEnglishName,
  appName,
  appTagline,
  appVersion,
  repositoryUrl,
} from "./app-meta";

describe("app metadata", () => {
  it("uses the PayDance brand without legacy wording", () => {
    expect(appName).toBe("薪跳");
    expect(appEnglishName).toBe("PayDance");
    expect(appTagline).toBe("桌面实时薪资仪表盘");
  });

  it("records the project repository", () => {
    expect(repositoryUrl).toBe("https://github.com/MasterBao66/PayDance");
  });

  it("records the product author attribution", () => {
    expect(appAuthor).toBe("Mr.Baober");
    expect(appCopyright).toBe("©️2026 Mr.Baober");
  });

  it("exposes the current app version for about surfaces", () => {
    expect(appVersion).toBe("0.8.2");
  });
});
