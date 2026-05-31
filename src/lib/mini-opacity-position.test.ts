// SPDX-FileCopyrightText: 2026 Mr.Baoboer
// SPDX-License-Identifier: AGPL-3.0-only
//
// Additional terms: see /ADDITIONAL_TERMS.md

import { describe, expect, it } from "vitest";
import {
  miniOpacityPanelLogicalSize,
  resolveMiniOpacityPanelAnchorRect,
  resolveMiniOpacityPanelWindowPosition,
  resolveMiniOpacityPanelPhysicalGap,
  resolveMiniOpacityPanelPhysicalSize,
  resolveMiniOpacityPanelPosition,
  resolveScreenWorkArea,
} from "./mini-opacity-position";

describe("mini opacity panel positioning", () => {
  it("keeps the opacity panel very small in logical pixels", () => {
    expect(miniOpacityPanelLogicalSize).toEqual({ width: 108, height: 52 });
  });

  it("scales the companion window size and gap for native physical placement", () => {
    expect(resolveMiniOpacityPanelPhysicalSize(1.25)).toEqual({
      height: 65,
      width: 135,
    });
    expect(resolveMiniOpacityPanelPhysicalGap(1.25)).toBe(10);
  });

  it("opens below the mini window and centers to it when there is room", () => {
    expect(
      resolveMiniOpacityPanelPosition({
        anchorRect: { height: 72, width: 210, x: 80, y: 120 },
        panelSize: { height: 52, width: 108 },
        workArea: { height: 720, width: 1280, x: 0, y: 0 },
      }),
    ).toEqual({ x: 131, y: 200 });
  });

  it("positions the companion window so its visible content centers to the mini content", () => {
    expect(
      resolveMiniOpacityPanelWindowPosition({
        anchorRect: { height: 54, width: 176, x: 140, y: 120 },
        gap: 8,
        panelInnerOffset: { x: 6, y: 4 },
        panelSize: { height: 52, width: 108 },
        workArea: { height: 720, width: 1280, x: 0, y: 0 },
      }),
    ).toEqual({ x: 168, y: 178 });
  });

  it("keeps visible centers aligned with scaled coordinates and a non-zero work area", () => {
    const position = resolveMiniOpacityPanelWindowPosition({
      anchorRect: { height: 68, width: 220, x: -1040, y: 180 },
      gap: 10,
      panelInnerOffset: { x: 9, y: 6 },
      panelSize: { height: 65, width: 135 },
      workArea: { height: 1380, width: 1920, x: -1920, y: 0 },
    });

    expect(position).toEqual({ x: -1006, y: 252 });
    expect(Math.abs(position.x + 9 + 135 / 2 - (-1040 + 220 / 2))).toBeLessThanOrEqual(
      0.5,
    );
  });

  it("opens above the mini window near the bottom edge", () => {
    expect(
      resolveMiniOpacityPanelPosition({
        anchorRect: { height: 72, width: 210, x: 80, y: 660 },
        panelSize: { height: 52, width: 108 },
        workArea: { height: 720, width: 1280, x: 0, y: 0 },
      }),
    ).toEqual({ x: 131, y: 600 });
  });

  it("stays inside the current monitor work area", () => {
    expect(
      resolveMiniOpacityPanelPosition({
        anchorRect: { height: 72, width: 210, x: -100, y: 120 },
        panelSize: { height: 52, width: 108 },
        workArea: { height: 720, width: 1280, x: 0, y: 0 },
      }),
    ).toEqual({ x: 8, y: 200 });
  });

  it("anchors to the mini window visual rect instead of the click point", () => {
    const targetRect = { height: 72, width: 210, x: 4, y: 4 };
    const windowOrigin = { x: 240, y: 160 };
    const clickPoints = [
      { x: 20, y: 30 },
      { x: 92, y: 30 },
      { x: 184, y: 30 },
    ];

    const positions = clickPoints.map((clientPoint) => {
      const anchorRect = resolveMiniOpacityPanelAnchorRect({
        clientPoint,
        screenPoint: {
          x: windowOrigin.x + clientPoint.x,
          y: windowOrigin.y + clientPoint.y,
        },
        targetRect,
      });

      return resolveMiniOpacityPanelPosition({
        anchorRect,
        panelSize: miniOpacityPanelLogicalSize,
        workArea: { height: 720, width: 1280, x: 0, y: 0 },
      });
    });

    expect(positions).toEqual([
      { x: 295, y: 244 },
      { x: 295, y: 244 },
      { x: 295, y: 244 },
    ]);
  });

  it("reads the browser screen work area in logical pixels", () => {
    expect(
      resolveScreenWorkArea({
        availHeight: 720,
        availLeft: -1280,
        availTop: 20,
        availWidth: 1280,
      }),
    ).toEqual({ height: 720, width: 1280, x: -1280, y: 20 });
  });
});
