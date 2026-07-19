// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { describe, expect, it } from "vitest";
import packageMetadata from "../../package.json";
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
    expect(repositoryUrl).toBe("https://github.com/MrBaoboer/PayDance");
  });

  it("records the product author attribution", () => {
    expect(appAuthor).toBe("Mr.Baoboer");
    expect(appCopyright).toBe("© 2026 Mr.Baoboer");
  });

  it("exposes the current app version for about surfaces", () => {
    expect(appVersion).toMatch(/^\d+\.\d+\.\d+$/);
    expect(appVersion).toBe(packageMetadata.version);
  });

  it("exposes the versioned Windows release download", () => {
    expect(windowsDownloadAssetName).toBe(`pay-dance-v${appVersion}-windows-x64.exe`);
    expect(windowsDownloadUrl).toBe(
      `https://github.com/MrBaoboer/PayDance/releases/latest/download/pay-dance-v${appVersion}-windows-x64.exe`,
    );
  });
});
