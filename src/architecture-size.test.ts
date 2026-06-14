// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import { describe, expect, it } from "vitest";
import onboardingPanelSource from "./components/OnboardingPanel.vue?raw";
import settingsPanelSource from "./components/SettingsPanel.vue?raw";
import salarySource from "./lib/salary.ts?raw";
import webPreviewCssSource from "./web-preview/web-preview.css?raw";
import rustLibSource from "../src-tauri/src/lib.rs?raw";

const withoutLicenseHeader = (source: string) =>
  source
    .replace(/^<!--\r?\nSPDX-FileCopyrightText:[\s\S]*?-->\r?\n\r?\n/, "")
    .replace(
      /^(<script setup lang="ts">\r?\n)\/\/ SPDX-FileCopyrightText:.*\r?\n\/\/ SPDX-License-Identifier:.*\r?\n\/\/\r?\n\/\/ Additional terms: see \/legal\/ADDITIONAL_TERMS\.md\r?\n/,
      "$1",
    );
const lineCount = (source: string) => withoutLicenseHeader(source).split(/\r?\n/).length;

describe("architecture size boundaries", () => {
  it("keeps large UI and salary entry files below the maintenance limit", () => {
    expect(lineCount(onboardingPanelSource)).toBeLessThanOrEqual(350);
    expect(lineCount(settingsPanelSource)).toBeLessThanOrEqual(260);
    expect(lineCount(salarySource)).toBeLessThanOrEqual(80);
    expect(lineCount(webPreviewCssSource)).toBeLessThanOrEqual(20);
    expect(lineCount(rustLibSource)).toBeLessThanOrEqual(80);
  });
});
