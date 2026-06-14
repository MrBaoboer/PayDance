// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /legal/ADDITIONAL_TERMS.md

export const openExternalUrl = async (url: string) => {
  window.open(url, "_blank", "noopener,noreferrer");
};
