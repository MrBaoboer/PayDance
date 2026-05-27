import { describe, expect, it } from "vitest";
import {
  appAuthor,
  appCopyright,
  appEnglishName,
  appName,
  appTagline,
  appVersion,
  repositoryUrl,
  windowsDownloadAssetName,
  windowsDownloadUrl,
} from "./app-meta";

describe("app metadata", () => {
  it("uses the PayDance brand without legacy wording", () => {
    expect(appName).toBe("薪跳");
    expect(appEnglishName).toBe("PayDance");
    expect(appTagline).toBe("桌面实时工资看板");
  });

  it("records the project repository", () => {
    expect(repositoryUrl).toBe("https://github.com/MasterBao66/PayDance");
  });

  it("records the product author attribution", () => {
    expect(appAuthor).toBe("Mr.Baoboer");
    expect(appCopyright).toBe("© 2026 Mr.Baoboer");
  });

  it("exposes the current app version for about surfaces", () => {
    expect(appVersion).toBe("0.8.15");
  });

  it("exposes the versioned Windows release download", () => {
    expect(windowsDownloadAssetName).toBe("pay-dance-v0.8.15-windows-x64.exe");
    expect(windowsDownloadUrl).toBe(
      "https://github.com/MasterBao66/PayDance/releases/latest/download/pay-dance-v0.8.15-windows-x64.exe",
    );
  });
});
