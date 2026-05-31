// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /ADDITIONAL_TERMS.md

export const resizeHandles = [
  { className: "resize-handle--north", direction: "North" },
  { className: "resize-handle--east", direction: "East" },
  { className: "resize-handle--south", direction: "South" },
  { className: "resize-handle--west", direction: "West" },
  { className: "resize-handle--north-east", direction: "NorthEast" },
  { className: "resize-handle--north-west", direction: "NorthWest" },
  { className: "resize-handle--south-east", direction: "SouthEast" },
  { className: "resize-handle--south-west", direction: "SouthWest" },
] as const;

export type ResizeDirection = (typeof resizeHandles)[number]["direction"];
