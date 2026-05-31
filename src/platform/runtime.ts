// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /ADDITIONAL_TERMS.md

export const payDanceTarget =
  import.meta.env.MODE === "web" || import.meta.env.VITE_PAYDANCE_TARGET === "web"
    ? "web"
    : "desktop";

export const isWebPreview = payDanceTarget === "web";
