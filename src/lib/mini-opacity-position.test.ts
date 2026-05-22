import { describe, expect, it } from "vitest";
import {
  miniOpacityPanelLogicalSize,
  resolveMiniOpacityPanelPosition,
  resolvePointerMiniOpacityPanelPosition,
} from "./mini-opacity-position";

describe("mini opacity panel positioning", () => {
  it("keeps the opacity panel very small in logical pixels", () => {
    expect(miniOpacityPanelLogicalSize).toEqual({ width: 108, height: 52 });
  });

  it("opens below the mini window and centers to it when there is room", () => {
    expect(
      resolveMiniOpacityPanelPosition({
        miniWindow: { height: 56, width: 180, x: 360, y: 240 },
        panelSize: { height: 52, width: 108 },
        workArea: { height: 720, width: 1280, x: 0, y: 0 },
      }),
    ).toEqual({ x: 396, y: 302 });
  });

  it("opens above the mini window near the bottom edge", () => {
    expect(
      resolveMiniOpacityPanelPosition({
        miniWindow: { height: 56, width: 180, x: 360, y: 670 },
        panelSize: { height: 52, width: 108 },
        workArea: { height: 720, width: 1280, x: 0, y: 0 },
      }),
    ).toEqual({ x: 396, y: 612 });
  });

  it("stays inside the current monitor work area", () => {
    expect(
      resolveMiniOpacityPanelPosition({
        miniWindow: { height: 56, width: 180, x: -100, y: 240 },
        panelSize: { height: 52, width: 108 },
        workArea: { height: 720, width: 1280, x: 0, y: 0 },
      }),
    ).toEqual({ x: 6, y: 302 });
  });

  it("falls back to the pointer when window geometry cannot be read", () => {
    expect(
      resolvePointerMiniOpacityPanelPosition({
        panelSize: { height: 52, width: 108 },
        pointer: { x: 1240, y: 700 },
        workArea: { height: 720, width: 1280, x: 0, y: 0 },
      }),
    ).toEqual({ x: 1126, y: 642 });
  });
});
