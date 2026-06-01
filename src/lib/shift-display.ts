// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

import type { SalaryStatus } from "./salary";
import type { Messages } from "../i18n/types";

export type TFunc = (
  key: keyof Messages,
  params?: Record<string, string | number>,
) => string;

export function getStatusText(
  status: SalaryStatus,
  isNightWork: boolean,
  hasConfigIssues: boolean,
  t: TFunc,
) {
  if (hasConfigIssues) return t("status.invalidConfig");

  const statusKeyMap: Record<SalaryStatus, keyof Messages> = {
    "after-work": isNightWork ? "status.nightWorkDone" : "status.afterWork",
    "before-work": "status.beforeWork",
    "invalid-config": "status.invalidConfig",
    "lunch-break": "status.lunchBreak",
    "rest-day": "status.restDay",
    working: isNightWork ? "status.nightWork" : "status.working",
  };

  return t(statusKeyMap[status]);
}
